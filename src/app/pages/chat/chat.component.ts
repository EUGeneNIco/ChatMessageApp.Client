import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { environment } from '../../../environments/environment';

interface Message {
  data: string,
  from: string,
  time: string,
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
  onlineUsersCount: number = 0;

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
        .withUrl(environment.hubUrl)
        // .withUrl('chat/')
        .build();

      this.hubConnection.on('ReceiveAdminUpdate', (username, msg, time) => {
        // console.log('ReceiveAdminUpdate', msg);
        const message = {
          data: msg,
          from: username,
          time: time,
          messageIn: true
        };
        this.messages.push(message);
      });

      this.hubConnection.on('GetOnlineUsersData', (username, data) => {
        // console.log('GetOnlineUsersData', data);
        this.onlineUsersCount = data;
      });

      this.hubConnection.on('ReceiveSpecificMessage', (username, msg, time) => {
        // console.log('ReceiveSpecificMessage', msg);
        const message = {
          data: msg,
          from: username,
          time: time,
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
        from: this.username,
        time: this.get12HourFormat(),
        messageIn: false
      });

      await this.hubConnection.invoke('SendMessage', this.message?.value, this.username);
      this.messageFormModel.reset();
    }
  }

  private get12HourFormat() {
    let date = new Date();

    let hours = date.getHours();
    let minutes = date.getMinutes();

    // Check whether AM or PM
    let newformat = hours >= 12 ? 'PM' : 'AM';

    // Find current hour in AM-PM Format
    hours = hours % 12;

    // To display "0" as "12"
    hours = hours ? hours : 12;
    const finaMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const finalHours = hours < 10 ? `0${hours}` : `${hours}`;

    return `${finalHours}:${finaMinutes} ${newformat}`;
  }
}
