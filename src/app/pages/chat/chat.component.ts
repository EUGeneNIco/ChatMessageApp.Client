import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';

interface Message {
  data: string,
  messageIn: boolean
}
@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [RouterOutlet, ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent {
  hubConnection!: HubConnection;
  messageFormModel!: FormGroup;

  messages: Message[] = [];
  username: string = '';
  chatRoom: string = 'Test Chat Room';

  get message() { return this.messageFormModel.get('message') };

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    // Get username from route
    this.route.params.subscribe(p => {
      if (p['username']) {
        this.username = p['username'];
      }
    })

    this.initForm();
    this.initHubConnection();
  }
  private initForm() {
    if (!this.messageFormModel) {
      this.messageFormModel = this.fb.group({
        message: ['', Validators.required]
      });
    }
  }

  async initHubConnection() {
    try {
      this.hubConnection = new HubConnectionBuilder()
        .withUrl('https://localhost:7030/chat')
        .build();

      this.hubConnection.on('ReceiveMessage', (username, msg) => {
        console.log('ReceiveMessage', msg);
        const message = {
          data: `${msg} - ${username}`,
          messageIn: true
        };
        this.messages.push(message);
      });

      this.hubConnection.on('ReceiveSpecificMessage', (username, msg) => {
        console.log('ReceiveSpecificMessage', msg);
        const message = {
          data: `${msg} - ${username}`,
          messageIn: true
        };
        this.messages.push(message);
      });

      await this.hubConnection
        .start()
        .then(() => {
          console.log('Connected to SignalR hub')
          this.joinChatRoom();
        })
        .catch(err => console.error('Error connecting to SignalR hub:', err));

    } catch (error) {
      console.log('error connecting to hub: ', error);
    }
  }

  async joinChatRoom() {
    await this.hubConnection.invoke('JoinSpecificChatRoom', { 'username': this.username, 'chatRoom': this.chatRoom });
  }

  async onSendMessage() {
    if (this.messageFormModel.valid) {
      this.messages.push({
        data: this.message?.value,
        messageIn: false
      });

      await this.hubConnection.invoke('SendMessage', this.message?.value);
      this.messageFormModel.reset();
    }
  }
}
