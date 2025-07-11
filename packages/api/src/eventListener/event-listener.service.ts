import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { ConversationRunnerService } from '../conversation/conversation-runner.service';
import GAME_SESSION_ABI from '../abis/GameSession.json';
import { roles } from 'src/graph/agents';

@Injectable()
export class EventListenerService implements OnModuleInit {
  private readonly logger = new Logger(EventListenerService.name);
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Signer;
  private contract: ethers.Contract;

  constructor(
    private readonly conversationRunnerService: ConversationRunnerService,
    private readonly configService: ConfigService,
  ) {
    const rpcUrl = this.configService.get<string>('RPC_URL');
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    const privateKey = this.configService.get<string>('PRIVATE_KEY');
    this.signer = new ethers.Wallet(privateKey, this.provider);

    const contractAddress = this.configService.get<string>('CONTRACT_ADDRESS');
    this.contract = new ethers.Contract(
      contractAddress,
      GAME_SESSION_ABI,
      this.signer,
    );
  }

  onModuleInit() {
    this.listenToEvents();
    this.startPendingSessionChecker();
  }

  listenToEvents() {
    this.contract.on('AllPlayersJoined', async (sessionId, event) => {
      this.logger.log(
        `AllPlayersJoined event detected for sessionId: ${sessionId.toString()}`,
      );
      await this.handleSessionStart(sessionId);
    });
  }

  async handleSessionStart(sessionId: number) {
    try {
      const impostorIndex = Math.floor(Math.random() * roles.length);
      this.logger.log(`Selected impostor: ${roles[impostorIndex].name}`);
      const nonce = Math.floor(Math.random() * 100_000_000);

      const commitment = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['uint256', 'uint256'],
          [impostorIndex, nonce],
        ),
      );

      const txStart = await this.contract.startGame(sessionId, commitment);
      await txStart.wait();
      this.logger.log(`startGame called for sessionId ${sessionId.toString()}`);

      this.conversationRunnerService.initializeConversation(impostorIndex);

      setTimeout(async () => {
        this.conversationRunnerService.stopConversation();
        const txEnd = await this.contract.endGame(
          sessionId,
          impostorIndex,
          nonce,
        );
        await txEnd.wait();
        this.logger.log(`endGame called for sessionId ${sessionId.toString()}`);
      }, 600_000);
    } catch (error) {
      this.logger.error(`Error starting session ${sessionId}:`, error);
    }
  }

  startPendingSessionChecker() {
    this.logger.log('Starting periodic checker for pending sessions...');
    setInterval(async () => {
      try {
        const sessionCounter: bigint = await this.contract.sessionCounter();
        const latestSessionId = sessionCounter.toString();

        const session = await this.contract.getGameSession(latestSessionId);

        const started = session.started;
        const ended = session.ended;
        const players = session.players;
        const maxPlayers = Number(session.maxPlayers);

        if (!started && !ended && players.length === maxPlayers) {
          this.logger.warn(
            `Session ${latestSessionId} has enough players but was not started. Starting now...`,
          );
          await this.handleSessionStart(Number(latestSessionId));
        }
      } catch (error) {
        this.logger.error('Error checking for pending sessions', error);
      }
    }, 10_000); // Check every 10 seconds
  }
}
