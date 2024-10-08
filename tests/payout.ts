import * as anchor from "@coral-xyz/anchor";
import { Program, web3 } from "@coral-xyz/anchor";
import { OverUnder } from "../target/types/over_under";
import {
  Transaction,
  Ed25519Program,
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import BN from "bn.js";

// use my local keypair for signing
import wallet from "/home/agent/.config/solana/id.json";

// Get the keypair from the wallet
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

describe("over_under", () => {
    // Configure the client to use the local cluster.
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const connection = provider.connection;
    const program = anchor.workspace.OverUnder as Program<OverUnder>;
  
    const confirm = async (signature: string): Promise<string> => {
      const block = await connection.getLatestBlockhash();
      await connection.confirmTransaction({ signature, ...block });
      return signature;
    };
  
    const log = async (signature: string): Promise<string> => {
      console.log(signature);
      return signature;
    };
  
    const [global] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("global"), keypair.publicKey.toBuffer()],
      program.programId
    );
  
    it("Payed Out!", async () => {
        // Fetch the global account
        const globalAccount = await program.account.global.fetch(global);
    
        console.log("global number: ", globalAccount.number.toString());
    
        const _roundBN = new BN(globalAccount.round.toString());
    
        // Convert to 8-byte Buffer in little-endian for other operations
        const _roundBuffer = _roundBN.toArrayLike(Buffer, "le", 8);
    
        const [round] = web3.PublicKey.findProgramAddressSync(
          [Buffer.from("round"), global.toBuffer(), _roundBuffer],
          program.programId
        );
    
        const [vault] = web3.PublicKey.findProgramAddressSync(
          [Buffer.from("vault"), round.toBuffer()],
          program.programId
        );
        const roundAccount = await program.account.round.fetch(round);
        console.log(`round: `, roundAccount.round.toString());
    
        const [bet] = web3.PublicKey.findProgramAddressSync(
          [Buffer.from("bet"), round.toBuffer(), keypair.publicKey.toBuffer()],
          program.programId
        );
        // fetch the bet
        // const betAccount = await program.account.bet.fetch(bet);
        // console.log("bet player: ", betAccount.player.toString());
        // console.log("bet bet: ", betAccount.bet.toString());
        // console.log(`bet amount: `, betAccount.amount.toString());
        // console.log("bet made in round: ", betAccount.round.toString());
        // console.log("bet payout: ", betAccount.payout.toString());
    
        /// DOCS: The ACCOUNTS object is constructed from required accounts + dynamically derived bet accounts for each round
        // Initialize the ACCOUNTS object with required accounts
        const ACCOUNTS = {
          house: keypair.publicKey,
          global,
          round,
          vault,
          systemProgram: SystemProgram.programId,
        };
    
        // Main logic to populate ACCOUNTS with player# and bet#
        const maxPlayers = 10; // Maximum number of players
        for (let i = 0; i < maxPlayers; i++) {
          if (i < roundAccount.players.length && i < roundAccount.bets.length) {
            // Directly use the playerPublicKey and betPublicKey from the vectors
            const playerPublicKey = roundAccount.players[i];
            const betPublicKey = roundAccount.bets[i];
            // Store the player public key and bet public key in ACCOUNTS
            ACCOUNTS[`player${i + 1}`] = playerPublicKey;
            ACCOUNTS[`bet${i + 1}`] = betPublicKey;
          } else {
            // Populate the remaining slots with null if any
            ACCOUNTS[`player${i + 1}`] = null;
            ACCOUNTS[`bet${i + 1}`] = null;
          }
        }
        // console.log("ACCOUNTS: ", ACCOUNTS);
        // console.log("ACCOUNTS length: ", Object.keys(ACCOUNTS).length);
        // console.log("ACCOUNTS keys: ", Object.keys(ACCOUNTS));
        // console.log("ACCOUNTS values: ", Object.values(ACCOUNTS));
        // console.log("ACCOUNTS entries: ", Object.entries(ACCOUNTS));
        // console.log("ACCOUNTS player1: ", ACCOUNTS[0]);
        // console.log("ACCOUNTS bet1: ", ACCOUNTS[0]);
        // console.log("ACCOUNTS player2: ", ACCOUNTS[1]);
        // console.log("ACCOUNTS bet2: ", ACCOUNTS[1]);
    
        // Construct the instruction with the populated ACCOUNTS object
        const tx = await program.methods
          .payout()
          .accounts(ACCOUNTS)
          .rpc()
          .then(confirm)
          .then(log);
      });
})