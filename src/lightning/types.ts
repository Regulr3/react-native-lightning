export type TCurrentLndState = {
  lndRunning: boolean;
  walletUnlocked: boolean;
  grpcReady: boolean;
};

export enum EGrpcSyncMethods {
  EstimateFee = 'EstimateFee',
  PendingChannels = 'PendingChannels',
  NewAddress = 'NewAddress',
  AddInvoice = 'AddInvoice',
  GetNodeInfo = 'GetNodeInfo',
  DisconnectPeer = 'DisconnectPeer',
  GetNetworkInfo = 'GetNetworkInfo',
  ChannelBalance = 'ChannelBalance',
  ListPeers = 'ListPeers',
  LookupInvoice = 'LookupInvoice',
  ListInvoices = 'ListInvoices',
  SendMany = 'SendMany',
  SendPaymentSync = 'SendPaymentSync',
  ForwardingHistory = 'ForwardingHistory',
  DebugLevel = 'DebugLevel',
  SetScores = 'SetScores',
  Status = 'Status',
  QueryScores = 'QueryScores',
  FeeReport = 'FeeReport',
  SendToRouteSync = 'SendToRouteSync',
  ListUnspent = 'ListUnspent',
  ExportAllChannelBackups = 'ExportAllChannelBackups',
  GetNodeMetrics = 'GetNodeMetrics',
  GetInfo = 'GetInfo',
  ChangePassword = 'ChangePassword',
  DeleteAllPayments = 'DeleteAllPayments',
  ListPayments = 'ListPayments',
  SendCoins = 'SendCoins',
  VerifyMessage = 'VerifyMessage',
  FundingStateStep = 'FundingStateStep',
  WalletBalance = 'WalletBalance',
  GetTransactions = 'GetTransactions',
  DescribeGraph = 'DescribeGraph',
  QueryRoutes = 'QueryRoutes',
  SignMessage = 'SignMessage',
  GetRecoveryInfo = 'GetRecoveryInfo',
  DecodePayReq = 'DecodePayReq',
  GetChanInfo = 'GetChanInfo',
  RestoreChannelBackups = 'RestoreChannelBackups',
  ConnectPeer = 'ConnectPeer',
  ListChannels = 'ListChannels',
  VerifyChanBackup = 'VerifyChanBackup',
  OpenChannelSync = 'OpenChannelSync',
  ClosedChannels = 'ClosedChannels',
  ExportChannelBackup = 'ExportChannelBackup',
  StopDaemon = 'StopDaemon',
  ModifyStatus = 'ModifyStatus',
  UpdateChannelPolicy = 'UpdateChannelPolicy',
  BakeMacaroon = 'BakeMacaroon'
}

export enum EGrpcStreamMethods {
  CloseChannel = 'CloseChannel',
  ChannelAcceptor = 'ChannelAcceptor',
  SubscribeChannelBackups = 'SubscribeChannelBackups',
  SubscribePeerEvents = 'SubscribePeerEvents',
  SubscribeChannelGraph = 'SubscribeChannelGraph',
  SubscribeInvoices = 'SubscribeInvoices',
  SubscribeTransactions = 'SubscribeTransactions',
  SubscribeChannelEvents = 'SubscribeChannelEvents',
  SendPayment = 'SendPayment',
  SendToRoute = 'SendToRoute'
}

export enum ENetworks {
  regtest = 'regtest',
  testnet = 'testnet',
  mainnet = 'mainnet'
}

export enum EStreamEventType {
  data = 'data',
  error = 'error'
}

export type TNativeStreamResponse = {
  data: string | undefined;
  event: EStreamEventType;
  streamId: string;
  error: string | undefined;
};

export enum EStreamEventTypes {
  Logs = 'logs',
  StreamEvent = 'streamEvent',
  LndStateUpdate = 'lndStateUpdate'
}

export type TLndConfValue = string | number | boolean | string[];

export type TLndConfSection = {
  [key: string]: TLndConfValue;
};

export type TLndConf = {
  [key: string]: TLndConfSection;
};