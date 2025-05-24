import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConversationRunnerService } from '../conversation/conversation-runner.service';
import { roles } from 'src/graph/agents';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';

@Injectable()
export class EventListenerService implements OnModuleInit {
  private readonly network: 'mainnet' | 'testnet' | 'devnet' | 'localnet';
  private client: SuiClient;
  private signer: Ed25519Keypair;
  private sessionDuration = 10 * 60; // 10 minutes
  private managedSessions = new Set<string>();

  constructor(
    private readonly conversationRunnerService: ConversationRunnerService,
    private readonly configService: ConfigService,
  ) {
    this.network = this.configService.get<
      'mainnet' | 'testnet' | 'devnet' | 'localnet'
    >('SUI_NETWORK');
    const rpcUrl = getFullnodeUrl(this.network);

    this.client = new SuiClient({ url: rpcUrl });

    const adminSecretKey = this.configService.get<string>('ADMIN_SECRET_KEY');
    this.signer = Ed25519Keypair.fromSecretKey(adminSecretKey);
  }

  async onModuleInit() {
    await this.keeperLoop();
  }

  sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

  async getGameSessionIds() {
    // Fetch the shared GameSessionList object and extract the session IDs
    const obj = await this.client.getObject({
      id: this.configService.get<string>('GAME_SESSION_LIST_ID')!,
      options: { showContent: true },
    });

    const ids: string[] = (
      (obj.data?.content as any)?.fields?.game_session_ids ?? []
    ).map((x: any) => (typeof x === 'string' ? x : x.fields?.id || x.id));
    return ids;
  }

  async getGameSession(sessionId: string) {
    const obj = await this.client.getObject({
      id: sessionId,
      options: { showContent: true },
    });
    return (obj.data?.content as any)?.fields;
  }

  async startSession(session: any) {
    const impostorIndex = Math.floor(Math.random() * roles.length);

    const tx = new Transaction();
    tx.moveCall({
      package: this.configService.get<string>('PKG_ID'),
      module: 'game_session',
      function: 'start',
      arguments: [
        tx.object(this.configService.get<string>('ADMIN_CAP_ID')),
        tx.object(session.id),
        tx.pure.option('u8', impostorIndex),
        tx.object.clock(),
      ],
    });
    const result = await this.client.signAndExecuteTransaction({
      signer: this.signer,
      transaction: tx,
    });
    console.log('✅ tx sent:', result.digest);

    this.conversationRunnerService.initializeConversation(impostorIndex);

    const updatedSession = {
      ...session,
      startTime: Date.now(),
    };

    this.scheduleEndSession(updatedSession);
  }

  async scheduleEndSession(session: any) {
    const now = Date.now();
    const endTime =
      new Date(parseInt(session.startTime)).getTime() +
      this.sessionDuration * 1000;
    const waitTime = Math.max(endTime - now, 0);

    console.log(
      `🔔 Next trigger in ${Math.ceil(waitTime / 1000)}s (ends @ ${new Date(
        endTime,
      ).toLocaleString()})`,
    );
    await this.sleep(waitTime);

    // call 'end' with up to 5 retries
    let attempt = 0;
    while (true) {
      try {
        const tx = new Transaction();
        tx.moveCall({
          package: this.configService.get<string>('PKG_ID'),
          module: 'game_session',
          function: 'end',
          arguments: [
            tx.object(this.configService.get<string>('ADMIN_CAP_ID')),
            tx.object(session.id),
            tx.object.clock(),
          ],
        });
        const result = await this.client.signAndExecuteTransaction({
          signer: this.signer,
          transaction: tx,
        });
        console.log('✅ tx sent:', result.digest);

        this.conversationRunnerService.stopConversation();
        break;
      } catch (e) {
        attempt++;
        console.warn(`⚠️ trigger attempt #${attempt} failed:`, e);
        if (attempt >= 5) {
          console.error(
            '❌ All trigger retries failed, giving up until next round',
          );
          break;
        }
        await this.sleep(1_000);
      }
    }
  }

  async handleSession(session: any) {
    if (!session.started) {
      await this.startSession(session);
    } else {
      await this.scheduleEndSession(session);
    }
  }

  async keeperLoop() {
    while (true) {
      try {
        const sessionIds = await this.getGameSessionIds();
        for (const sessionId of sessionIds) {
          if (this.managedSessions.has(sessionId)) continue; // Already running for this session

          // Fetch session details
          const session = await this.getGameSession(sessionId);
          const sessionData = {
            id: sessionId,
            max_players: session.max_players,
            players: session.players,
            started: session.started,
            startTime: session.start_time,
            ended: session.ended,
          };

          // Only handle sessions that are not ended
          if (
            !sessionData.ended &&
            sessionData.players.length === sessionData.max_players
          ) {
            this.managedSessions.add(sessionId);
            this.handleSession(sessionData)
              .catch((e) => {
                console.error('Error handling session:', e);
              })
              .finally(() => {
                // When finished, remove from managed set
                this.managedSessions.delete(sessionId);
              });
          }
        }
      } catch (e) {
        console.error('💥 Keeper loop error, retrying in 5 s:', e);
        await this.sleep(3_000);
      }

      // Poll every 5 seconds
      await this.sleep(5_000);
    }
  }
}
