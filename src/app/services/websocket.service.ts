// import { Injectable } from '@angular/core';
// import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
// import { Observable } from 'rxjs';

// @Injectable({
//   providedIn: 'root'
// })
// export class WebsocketService {
//   private socket$!: WebSocketSubject<any>;

//   connect(): void {
//     if (!this.socket$ || this.socket$.closed) {
//       this.socket$ = webSocket('ws://localhost:4000');
//       console.log('✅ WebSocket connected to ws://localhost:4000');
//     }
//   }

//   getMessages(): Observable<any> {
//     return this.socket$.asObservable();
//   }

//   sendMessage(msg: any): void {
//     if (this.socket$) {
//       this.socket$.next(msg);
//     }
//   }

//   close(): void {
//     if (this.socket$) {
//       this.socket$.complete();
//       console.log('❌ WebSocket connection closed');
//     }
//   }
// }


import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket$: WebSocketSubject<any> | null = null;
  // private readonly WS_URL = 'ws://localhost:4000';
  // private readonly WS_URL = 'wss://www.shopynits.shop:4000';
  private readonly WS_URL = 'ws://taptoorder-websocket.onrender.com';


  constructor(@Inject(PLATFORM_ID) private platformId: any) {
    if (isPlatformBrowser(this.platformId)) {
      this.connect();
    }
  }

  connect(): void {
    if (!this.socket$ || this.socket$.closed) {
      this.socket$ = webSocket(this.WS_URL);
      console.log('✅ WebSocket connected in browser:', this.WS_URL);

      this.socket$.subscribe({
        // next: (msg) => console.log('📩 Message from server:', msg),
        error: (err) => console.error('❌ WebSocket error:', err),
        complete: () => console.warn('⚠️ WebSocket closed')
      });
    }
  }

  sendMessage(msg: any): void {
    if (isPlatformBrowser(this.platformId)) {
      if (!this.socket$ || this.socket$.closed) this.connect();
      this.socket$?.next(msg);
    }
  }

  getMessages(): Observable<any> {
    if (isPlatformBrowser(this.platformId)) {
      if (!this.socket$) this.connect();
      return this.socket$!.asObservable();
    } else {
      // SSR: return empty observable
      return new Observable(observer => observer.complete());
    }
  }

  closeConnection(): void {
    if (isPlatformBrowser(this.platformId)) this.socket$?.complete();
  }
}
