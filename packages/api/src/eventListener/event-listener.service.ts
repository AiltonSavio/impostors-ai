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
    // Initialize provider and signer using env variables (set RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS in your .env)
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
  }

  listenToEvents() {
    // Listen to the AllPlayersJoined event. (Assume the event signature is exactly as in your contract.)
    this.contract.on('AllPlayersJoined', async (sessionId, event) => {
      this.logger.log(
        `AllPlayersJoined event detected for sessionId: ${sessionId.toString()}`,
      );
      try {
        const impostorIndex = Math.floor(Math.random() * roles.length);
        this.logger.log(`selected impostor: ${roles[impostorIndex].name}`);
        const nonce = Math.floor(Math.random() * 100_000_000);

        // Compute the commitment hash using ethers:
        const commitment = ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            ['uint256', 'uint256'],
            [impostorIndex, nonce],
          ),
        );

        // Call startGame with the commitment
        const txStart = await this.contract.startGame(sessionId, commitment);
        await txStart.wait();
        this.logger.log(
          `startGame called for sessionId ${sessionId.toString()}`,
        );

        this.conversationRunnerService.initializeConversation(impostorIndex);

        // Schedule a timeout to end the game after 10 minutes (600000 ms)
        setTimeout(async () => {
          // Abort the conversation
          this.conversationRunnerService.stopConversation();
          // Call endGame with the actual reveal values
          const txEnd = await this.contract.endGame(
            sessionId,
            impostorIndex,
            nonce,
          );
          await txEnd.wait();
          this.logger.log(
            `endGame called for sessionId ${sessionId.toString()}`,
          );
        }, 600_000);
      } catch (error) {
        this.logger.error('Error handling AllPlayersJoined event', error);
      }
    });
  }
}
