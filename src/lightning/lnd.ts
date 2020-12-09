import { NativeModules, NativeModulesStatic } from 'react-native';
import GrpcAction from './grpc';
import { err, ok, Result } from './result';
import {
  TCurrentLndState,
  EGrpcStreamMethods,
  EGrpcSyncMethods,
  ENetworks,
  EStreamEventTypes
} from './types';
import { lnrpc } from './rpc';
import LndConf from './lnd.conf';

class LND {
  private readonly grpc: GrpcAction;
  private readonly lnd: NativeModulesStatic;

  constructor() {
    this.lnd = NativeModules.LndReactModule;
    this.grpc = new GrpcAction(this.lnd);
  }

  /**
   * Starts the LND service
   * @return {Promise<Ok<any, Error> | Err<unknown, any>>}
   * @param conf
   */
  async start(conf: LndConf): Promise<Result<string, Error>> {
    const stateRes = await this.currentState();
    if (stateRes.isErr()) {
      return err(stateRes.error);
    }

    const { lndRunning } = stateRes.value;
    if (lndRunning) {
      return ok('LND already running');
    }

    try {
      const res = await this.lnd.start(conf.build(), conf.network);
      return ok(res);
    } catch (e) {
      return err(e);
    }
  }

  /**
   * Generates wallet seed phrase which can be used in createWallet
   * @return {Promise<Ok<any, Error> | Err<unknown, any>>}
   */
  async genSeed(): Promise<Result<string[], Error>> {
    try {
      const seed = await this.lnd.genSeed();
      return ok(seed);
    } catch (e) {
      return err(e);
    }
  }

  /**
   * Once LND is started then the wallet can be created and unlocked with this.
   * @return {Promise<Result<string, Error>>}
   * @param password
   * @param seed
   */
  async createWallet(password: string, seed: string[]): Promise<Result<string, Error>> {
    try {
      const res = await this.lnd.createWallet(password, seed);
      return ok(res);
    } catch (e) {
      return err(e);
    }
  }

  /**
   * Once LND is started then the wallet can be unlocked with this.
   * @return {Promise<Result<string, Error>>}
   * @param password
   */
  async unlockWallet(password: string): Promise<Result<string, Error>> {
    try {
      const res = await this.lnd.unlockWallet(password);
      return ok(res);
    } catch (e) {
      return err(e);
    }
  }

  /**
   * Determines if a wallet has already been initialized for the network specified.
   * @return {Promise<Result<boolean, Error>>}
   * @param network
   */
  async walletExists(network: ENetworks): Promise<Result<boolean, Error>> {
    try {
      const exists = await this.lnd.walletExists(network);
      return ok(exists);
    } catch (e) {
      return err(e);
    }
  }

  /**
   * Provides the current state of LND from the native module
   * @return {Promise<Result<CurrentLndState, Error>>}
   */
  async currentState(): Promise<Result<TCurrentLndState, Error>> {
    try {
      return ok(await this.lnd.currentState());
    } catch (e) {
      return err(e);
    }
  }

  /**
   * Subscribe to the current LND service state
   * @param onUpdate
   */
  subscribeToCurrentState(onUpdate: (res: TCurrentLndState) => void): void {
    this.grpc.lndEvent.addListener(EStreamEventTypes.LndStateUpdate, onUpdate);
  }

  /**
   * LND GetInfo
   * @returns {Promise<Err<lnrpc.GetInfoResponse, any> | Ok<any, Error>>}
   */
  async getInfo(): Promise<Result<lnrpc.GetInfoResponse, Error>> {
    try {
      const message = lnrpc.GetInfoRequest.create();
      const serializedResponse = await this.grpc.sendCommand(
        EGrpcSyncMethods.GetInfo,
        lnrpc.GetInfoRequest.encode(message).finish()
      );

      return ok(lnrpc.GetInfoResponse.decode(serializedResponse));
    } catch (e) {
      return err(e);
    }
  }

  /**
   * LND GetAddress
   * @returns {Promise<Ok<lnrpc.NewAddressResponse, Error> | Err<unknown, any>>}
   * @param type
   */
  async getAddress(type?: lnrpc.AddressType): Promise<Result<lnrpc.NewAddressResponse, Error>> {
    try {
      const message = lnrpc.NewAddressRequest.create({ type });
      const serializedResponse = await this.grpc.sendCommand(
        EGrpcSyncMethods.NewAddress,
        lnrpc.NewAddressRequest.encode(message).finish()
      );

      return ok(lnrpc.NewAddressResponse.decode(serializedResponse));
    } catch (e) {
      return err(e);
    }
  }

  /**
   * LND GetWalletBalance
   * @returns {Promise<Ok<lnrpc.WalletBalanceResponse, Error> | Err<unknown, any>>}
   */
  async getWalletBalance(): Promise<Result<lnrpc.WalletBalanceResponse, Error>> {
    try {
      const message = lnrpc.WalletBalanceRequest.create();
      const serializedResponse = await this.grpc.sendCommand(
        EGrpcSyncMethods.WalletBalance,
        lnrpc.WalletBalanceRequest.encode(message).finish()
      );

      return ok(lnrpc.WalletBalanceResponse.decode(serializedResponse));
    } catch (e) {
      return err(e);
    }
  }

  /**
   * LND GetChannelBalance
   * @returns {Promise<Ok<lnrpc.ChannelBalanceResponse, Error> | Err<unknown, any>>}
   */
  async getChannelBalance(): Promise<Result<lnrpc.ChannelBalanceResponse, Error>> {
    try {
      const message = lnrpc.ChannelBalanceRequest.create();
      const serializedResponse = await this.grpc.sendCommand(
        EGrpcSyncMethods.ChannelBalance,
        lnrpc.ChannelBalanceRequest.encode(message).finish()
      );

      return ok(lnrpc.ChannelBalanceResponse.decode(serializedResponse));
    } catch (e) {
      return err(e);
    }
  }

  /**
   * LND ConnectPeer
   * @returns {Promise<Ok<lnrpc.ConnectPeerResponse, Error> | Err<unknown, any>>}
   * @param nodePubkey
   * @param host
   */
  async connectPeer(
    nodePubkey: string,
    host: string
  ): Promise<Result<lnrpc.ConnectPeerResponse, Error>> {
    try {
      const message = lnrpc.ConnectPeerRequest.create();

      const lightningAddress = lnrpc.LightningAddress.create();
      lightningAddress.pubkey = nodePubkey;
      lightningAddress.host = host;

      message.addr = lightningAddress;
      message.perm = true;

      const serializedResponse = await this.grpc.sendCommand(
        EGrpcSyncMethods.ConnectPeer,
        lnrpc.ConnectPeerRequest.encode(message).finish()
      );

      return ok(lnrpc.ConnectPeerResponse.decode(serializedResponse));
    } catch (e) {
      return err(e);
    }
  }

  /**
   * LND OpenChannelSync
   * @returns {Promise<Err<unknown, Error> | Ok<lnrpc.ChannelPoint, Error> | Err<unknown, any>>}
   * @param fundingAmount
   * @param nodePubkey
   * @param closeAddress
   */
  async openChannel(
    fundingAmount: number,
    nodePubkey: string,
    closeAddress: string | undefined = undefined
  ): Promise<Result<lnrpc.ChannelPoint, Error>> {
    try {
      const message = lnrpc.OpenChannelRequest.create();
      message.localFundingAmount = fundingAmount;

      // Create a new address for closing of channel if one wasn't provided
      if (closeAddress === undefined) {
        const newAddressRes = await this.getAddress();
        if (newAddressRes.isErr()) {
          return err(newAddressRes.error);
        }
        message.closeAddress = newAddressRes.value.address;
      } else {
        message.closeAddress = closeAddress;
      }

      message.nodePubkeyString = nodePubkey;
      message.pushSat = 0;

      // //TODO have the below config driven maybe
      message.minConfs = 2;
      message.targetConf = 2;
      message.spendUnconfirmed = false;

      const serializedResponse = await this.grpc.sendCommand(
        EGrpcSyncMethods.OpenChannelSync,
        lnrpc.OpenChannelRequest.encode(message).finish()
      );

      return ok(lnrpc.ChannelPoint.decode(serializedResponse));
    } catch (e) {
      return err(e);
    }
  }

  /**
   * LND CloseChannel
   * @returns {Promise<Err<unknown, Error> | Ok<lnrpc.ClosedChannelsResponse, Error> | Err<unknown, any>>}
   * @param channel
   * @param onUpdate
   * @param onDone
   */
  closeChannelStream(
    channel: lnrpc.IChannel,
    onUpdate: (res: Result<lnrpc.ClosedChannelsResponse, Error>) => void,
    onDone: (res: Result<boolean, Error>) => void
  ): void {
    const channelPoint = channel.channelPoint;
    if (!channelPoint) {
      onDone(err(new Error('Missing channel point')));
      return;
    }

    try {
      const message = lnrpc.CloseChannelRequest.create();

      // Recreate ChannelPoint obj from string found in channel
      const point = lnrpc.ChannelPoint.create();
      point.fundingTxid = 'fundingTxidStr';
      const [txid, txIndex] = channelPoint.split(':');
      point.outputIndex = Number(txIndex);
      point.fundingTxidStr = txid;
      message.channelPoint = point;

      // Decode the response before sending update back
      const onStateUpdate = (res: Result<Uint8Array, Error>): void => {
        if (res.isErr()) {
          onUpdate(err(res.error));
          return;
        }

        onUpdate(ok(lnrpc.ClosedChannelsResponse.decode(res.value)));
      };

      this.grpc.sendStreamCommand(
        EGrpcStreamMethods.CloseChannel,
        lnrpc.CloseChannelRequest.encode(message).finish(),
        onStateUpdate,
        onDone
      );
    } catch (e) {
      onDone(err(e));
    }
  }

  /**
   * LND subscribe to any changes to on-chain transaction states
   * @param onUpdate
   * @param onDone
   */
  subscribeToOnChainTransactions(
    onUpdate: (res: Result<lnrpc.Transaction, Error>) => void,
    onDone: (res: Result<boolean, Error>) => void
  ): void {
    try {
      const message = lnrpc.GetTransactionsRequest.create();

      // Decode the response before sending update back
      const onStateUpdate = (res: Result<Uint8Array, Error>): void => {
        if (res.isErr()) {
          onUpdate(err(res.error));
          return;
        }

        onUpdate(ok(lnrpc.Transaction.decode(res.value)));
      };

      this.grpc.sendStreamCommand(
        EGrpcStreamMethods.SubscribeTransactions,
        lnrpc.GetTransactionsRequest.encode(message).finish(),
        onStateUpdate,
        onDone
      );
    } catch (e) {
      onUpdate(err(e));
    }
  }

  /**
   * LND subscribe to any changes in invoice states
   * @param onUpdate
   * @param onDone
   */
  subscribeToInvoices(
    onUpdate: (res: Result<lnrpc.Invoice, Error>) => void,
    onDone: (res: Result<boolean, Error>) => void
  ): void {
    try {
      const message = lnrpc.ListInvoiceRequest.create();

      // Decode the response before sending update back
      const onStateUpdate = (res: Result<Uint8Array, Error>): void => {
        if (res.isErr()) {
          onUpdate(err(res.error));
          return;
        }

        onUpdate(ok(lnrpc.Invoice.decode(res.value)));
      };

      this.grpc.sendStreamCommand(
        EGrpcStreamMethods.SubscribeInvoices,
        lnrpc.ListInvoiceRequest.encode(message).finish(),
        onStateUpdate,
        onDone
      );
    } catch (e) {
      onUpdate(err(e));
    }
  }

  /**
   * LND ListChannels
   * @returns {Promise<Ok<lnrpc.ListChannelsResponse, Error> | Err<unknown, any>>}
   */
  async listChannels(): Promise<Result<lnrpc.ListChannelsResponse, Error>> {
    try {
      const message = lnrpc.ListChannelsRequest.create();
      const serializedResponse = await this.grpc.sendCommand(
        EGrpcSyncMethods.ListChannels,
        lnrpc.ListChannelsRequest.encode(message).finish()
      );

      return ok(lnrpc.ListChannelsResponse.decode(serializedResponse));
    } catch (e) {
      return err(e);
    }
  }

  /**
   * LND PayInvoice
   * @param invoice
   * @returns {Promise<Ok<lnrpc.SendResponse, Error> | Err<unknown, any>>}
   */
  async payInvoice(invoice: string): Promise<Result<lnrpc.SendResponse, Error>> {
    try {
      const message = lnrpc.SendRequest.create();
      message.paymentRequest = invoice;
      const serializedResponse = await this.grpc.sendCommand(
        EGrpcSyncMethods.SendPaymentSync,
        lnrpc.SendRequest.encode(message).finish()
      );

      return ok(lnrpc.SendResponse.decode(serializedResponse));
    } catch (e) {
      return err(e);
    }
  }

  /**
   * LND CreateInvoice
   * @param value
   * @param memo
   * @param expiry
   * @returns {Promise<Ok<lnrpc.SendResponse, Error> | Err<unknown, any>>}
   */
  async createInvoice(
    value: number,
    memo: string,
    expiry: number = 172800
  ): Promise<Result<lnrpc.AddInvoiceResponse, Error>> {
    try {
      const message = lnrpc.Invoice.create();
      message.value = value;
      message.memo = memo;
      message.expiry = expiry;
      const serializedResponse = await this.grpc.sendCommand(
        EGrpcSyncMethods.AddInvoice,
        lnrpc.Invoice.encode(message).finish()
      );

      return ok(lnrpc.AddInvoiceResponse.decode(serializedResponse));
    } catch (e) {
      return err(e);
    }
  }

  /**
   * LND ListInvoices
   * @returns {Promise<Ok<lnrpc.ListInvoiceResponse, Error> | Err<unknown, any>>}
   */
  async listInvoices(): Promise<Result<lnrpc.ListInvoiceResponse, Error>> {
    try {
      const message = lnrpc.ListInvoiceRequest.create();
      const serializedResponse = await this.grpc.sendCommand(
        EGrpcSyncMethods.ListInvoices,
        lnrpc.ListInvoiceRequest.encode(message).finish()
      );

      return ok(lnrpc.ListInvoiceResponse.decode(serializedResponse));
    } catch (e) {
      return err(e);
    }
  }
}

export default new LND();