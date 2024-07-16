using ChatMessageApp.DataService;
using ChatMessageApp.Models;
using Microsoft.AspNetCore.SignalR;

namespace ChatMessageApp.Hubs
{
    public class ChatHub : Hub
    {
        private readonly SharedDb _shared;

        public ChatHub(SharedDb shared)
        {
            _shared = shared;
        }

        public async Task JoinChat(UserConnection conn)
        {
            await Clients.All.SendAsync(method: "ReceiveMessage", "admin", $"{conn.Username} has joined.");
        }

        public async Task JoinSpecificChatRoom(UserConnection conn)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, conn.ChatRoom);

            _shared.connections[Context.ConnectionId] = conn;

            await Clients.GroupExcept(conn.ChatRoom, Context.ConnectionId).SendAsync("ReceiveMessage", "admin", $"{conn.Username} has joined {conn.ChatRoom}");
        }

        public async Task SendMessage(string message)
        {
            if (_shared.connections.TryGetValue(Context.ConnectionId, out UserConnection conn))
            {
                await Clients.GroupExcept(conn.ChatRoom, Context.ConnectionId)
                    .SendAsync("ReceiveSpecificMessage", conn.Username, message);
            }
        }
    }
}
