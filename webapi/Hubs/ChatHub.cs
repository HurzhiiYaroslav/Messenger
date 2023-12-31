﻿using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;
using Serilog;
using webapi.Entities;
using webapi.Services;
using webapi.Utilities;

namespace webapi.Hubs
{

    [EnableCors("CORS")]
    [Authorize]
    public partial class ChatHub : Hub
    {
        private static Dictionary<string, string> connectedUsers = new();
        private readonly ApplicationContext db;
        private readonly DialogService _dialogService;
        private readonly GroupService _groupService;
        private readonly ChannelService _channelService;
        public ChatHub(ApplicationContext db, DialogService dialogService,GroupService groupService, ChannelService channelService)
        {
            this.db = db;
            _dialogService = dialogService;
            _groupService = groupService;
            _channelService = channelService;

            Log.Logger = new LoggerConfiguration()
        .WriteTo.Console()
        .CreateLogger();
        }

        public override async Task OnConnectedAsync()
        {
            var userId = Context.GetHttpContext().Request.Query["username"];
            connectedUsers[Context.ConnectionId] = userId;

            await Clients.Others.SendAsync("UserConnected", userId);
            //await Test();

            var user = await db.Clients.FirstOrDefaultAsync(u => u.Id.ToString().ToUpper() == userId.ToString().ToUpper());

            if (user is not null)
            {
                List<Chat> chats = db.GetChatsForUser(user);
                await AddUserToGroups(Context.ConnectionId, chats);

                var userDataJson = JSONConvertor.ConvertChatDataToJson(user, db);
                await Clients.Client(Context.ConnectionId).SendAsync("UserData", userDataJson);

                var connectedUserList = connectedUsers.Values.ToList();
                await Clients.Client(Context.ConnectionId).SendAsync("ConnectedUsers", connectedUserList);
            }
            else
            {
                await Clients.Client(Context.ConnectionId).SendAsync("Relogin");
            }

            await base.OnConnectedAsync();
        }

        private async Task Notify(string chatId, string message)
        {
            var notify = new JObject
            {
                ["chatId"] = chatId,
                ["notification"] = message,
                ["time"] = DateTime.Now,
            };
            await Clients.Group(chatId).SendAsync("notify", notify.ToString());
        }

        public async Task<User> GetCurrentUserAsync()
        {
            var userId = connectedUsers[Context.ConnectionId];
            return await db.Clients.FirstOrDefaultAsync(u => u.Id.ToString() == userId.ToUpper());
        }

        public async Task AddUserToGroups(string userId, List<Chat> chats)
        {
            var tasks = chats.Select(chat => Groups.AddToGroupAsync(userId, chat.Id.ToString().ToLower()));
            await Task.WhenAll(tasks);
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            var username = connectedUsers[Context.ConnectionId];
            connectedUsers.Remove(Context.ConnectionId);
            await Clients.Others.SendAsync("UserDisconnected", username);
            await base.OnDisconnectedAsync(exception);
        }

        
    }

}
