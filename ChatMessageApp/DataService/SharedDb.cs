using ChatMessageApp.Models;
using System.Collections.Concurrent;

namespace ChatMessageApp.DataService
{
    public class SharedDb
    {
        private ConcurrentDictionary<string, UserConnection> _connections = new();

        public ConcurrentDictionary<string, UserConnection> connections => _connections;
    }
}
