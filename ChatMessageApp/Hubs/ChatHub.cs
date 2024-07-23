using ChatMessageApp.DataService;
using ChatMessageApp.Models;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace ChatMessageApp.Hubs
{
  public class ChatHub : Hub
  {
    private SharedDb _shared;

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

      if (!_shared.connections.Where(x => x.Value != null).Any(x => x.Value.Username == conn.Username))
      {
        _shared.connections[Context.ConnectionId] = conn;
        await Clients.GroupExcept(conn.ChatRoom, Context.ConnectionId).SendAsync("ReceiveAdminUpdate",
                                    "admin",
                                    $"{conn.Username} has joined.",
                                    DateTime.Now.ToString("hh:mm tt"));
      }

      await Clients.All.SendAsync("GetOnlineUsersData",
                                  "admin",
                                  _shared.connections.DistinctBy(x => x.Value.Username).ToList().Count);
    }

    public async Task LeaveChatRoom(UserConnection conn)
    {
      await Groups.RemoveFromGroupAsync(Context.ConnectionId, conn.ChatRoom);
      _shared.connections.Remove(Context.ConnectionId, out UserConnection removedUser); // remove via connection id

      if (_shared.connections.Where(x => x.Value != null).Any(x => x.Value.Username == conn.Username && x.Key != Context.ConnectionId))
      {
        var connection = _shared.connections
          .FirstOrDefault(x => x.Value.Username == conn.Username && x.Key != Context.ConnectionId);

        _shared.connections.Remove(connection.Key, out UserConnection removedUserViaName); // remove via connection id

        await Groups.RemoveFromGroupAsync(connection.Key, conn.ChatRoom);
      }

      await Clients.All.SendAsync("ReceiveAdminUpdate",
                                  "admin",
                                  $"{conn.Username} left the chat.",
                                  DateTime.Now.ToString("hh:mm tt"));

      await Clients.All.SendAsync("GetOnlineUsersData",
                                  "admin",
                                  _shared.connections.Where(x => x.Value != null).DistinctBy(x => x.Value.Username).ToList().Count);
    }

    public async Task SendMessage(string message, string username)
    {
      if (_shared.connections.TryGetValue(Context.ConnectionId, out UserConnection conn))
      {
        await Clients.All
            .SendAsync("ReceiveSpecificMessage", conn.Username, message, DateTime.Now.ToString("hh:mm tt"));
      }
      else
      {
        var hasSameNameConnectionRecord = _shared.connections.Any(x => x.Value.Username == username);

        if (hasSameNameConnectionRecord)
        {
          var connection = _shared.connections.FirstOrDefault(x => x.Value.Username == username);

          await Clients.All
              .SendAsync("ReceiveSpecificMessage", connection.Value.Username, message, DateTime.Now.ToString("hh:mm tt"));

          _shared.connections[Context.ConnectionId] = new UserConnection { ChatRoom = connection.Value.ChatRoom, Username = connection.Value.Username };
        }
      }
    }
  }
}
