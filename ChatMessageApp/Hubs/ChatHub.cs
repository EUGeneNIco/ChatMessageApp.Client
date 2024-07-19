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

            if (!_shared.connections.Any(x => x.Value.Username == conn.Username))
            {
                _shared.connections[Context.ConnectionId] = conn;
                await Clients.All.SendAsync("ReceiveAdminUpdate", "admin", $"{conn.Username} has joined.", DateTime.Now.ToString("hh:mm tt"), _shared.connections.Count);
            }

            await Clients.All.SendAsync("GetOnlineUsersData", "admin", _shared.connections.DistinctBy(x => x.Value.Username).ToList().Count);
          }

        public async Task SendMessage(string message, string username)
        {
            if (_shared.connections.TryGetValue(Context.ConnectionId, out  UserConnection conn))
            {
                await Clients.GroupExcept(conn.ChatRoom, Context.ConnectionId)
                    .SendAsync("ReceiveSpecificMessage", conn.Username, message, DateTime.Now.ToString("hh:mm tt"));
            }
            else
            {
                var hasConnectionRecord = _shared.connections.Any(x => x.Value.Username == username);

                if (hasConnectionRecord)
                {
                      var connection = _shared.connections.FirstOrDefault(x => x.Value.Username == username);

                      await Clients.GroupExcept(connection.Value.ChatRoom, Context.ConnectionId)
                          .SendAsync("ReceiveSpecificMessage", connection.Value.Username, message, DateTime.Now.ToString("hh:mm tt"));

                      _shared.connections[Context.ConnectionId] = new UserConnection { ChatRoom = connection.Value.ChatRoom, Username = connection.Value.Username };
                }
            }
        }
    }
}
