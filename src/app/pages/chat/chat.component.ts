import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { environment } from '../../../environment/environment';

interface Message {
  data: string,
  from: string,
  time: string,
  messageIn: boolean,
}

interface GenericMessage {
  key: string,
  value: string,
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
  genericMessages: GenericMessage[] = [];
  username: string = '';
  chatRoom: string = 'Test Chat Room';
  onlineUsersCount: number = 0;

  get message() { return this.messageFormModel.get('message') };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    // Get username from route
    this.route.params.subscribe(p => {
      if (p['username']) {
        this.username = p['username'];
      }
    })

    // this.genericMessages.push({ key: 'Berto', value: 'Berto' });
    
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

      this.hubConnection.on('SomeoneIsChatting', (username, data) => {
        // console.log('SomeoneIsChatting', `${username} ${data}`);

        if (data) {
          if (username !== this.username) {
            const message = {
              key: username,
              value: username
            };

            this.genericMessages.push(message);
          }
        }
        else {
          const message = this.genericMessages.find(x => x.key === username);
          if (message) {
            this.genericMessages = this.genericMessages.filter(x => x.key !== username);
          }
        }
      });

      this.hubConnection.on('ReceiveSpecificMessage', (username, msg, time) => {
        // console.log('ReceiveSpecificMessage', msg);
        const message = {
          data: msg,
          from: username,
          time: time,
          messageIn: username !== this.username
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

  async leaveChatRoom() {
    this.router.navigateByUrl('');
    await this.hubConnection.invoke('LeaveChatRoom', { 'username': this.username, 'chatRoom': this.chatRoom });
  }

  async onSendMessage() {
    if (this.messageFormModel.valid) {
      await this.hubConnection.invoke('SendMessage', this.message?.value, this.username);
      this.messageFormModel.reset();
    }
  }

  async startChatting() {
    // console.log('Started chatting...')
    await this.hubConnection.invoke('SendChattingAction', this.username, true);
  }

  async stopChatting() {
    // console.log('Stop chatting...')
    await this.hubConnection.invoke('SendChattingAction', this.username, false);
  }

  displayChattingMessage() {
    return this.genericMessages.length === 1
      ? `${this.genericMessages[0].value} is typing...`
      : `${this.genericMessages.length} members are typing...`;
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
