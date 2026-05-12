import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentMetricsService {
  private callbackSuccess = 0;
  private callbackFailed = 0;
  private callbackReplayRejected = 0;
  private callbackTxnConflict = 0;

  markCallbackSuccess(): void {
    this.callbackSuccess += 1;
  }

  markCallbackFailed(): void {
    this.callbackFailed += 1;
  }

  markReplayRejected(): void {
    this.callbackReplayRejected += 1;
  }

  markTxnConflict(): void {
    this.callbackTxnConflict += 1;
  }

  snapshot(): {
    callbackSuccess: number;
    callbackFailed: number;
    callbackReplayRejected: number;
    callbackTxnConflict: number;
  } {
    return {
      callbackSuccess: this.callbackSuccess,
      callbackFailed: this.callbackFailed,
      callbackReplayRejected: this.callbackReplayRejected,
      callbackTxnConflict: this.callbackTxnConflict,
    };
  }
}
