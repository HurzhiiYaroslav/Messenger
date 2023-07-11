﻿using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;
using webapi.Entities;

namespace webapi.Utils
{
    public static class JSONConvertor
    {
        public static object ChatDataJson(User u, ApplicationContext db)
        {
            try
            {
                var result = new JObject
                {
                    { "user", userData(u)},
                    {"chats",userChats(u,db) }

                };

                return result.ToString();
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
            }

            return null;
        }


        public static object UserSearchJson(User user,string userInput, ApplicationContext db)
        {
            try
            {
                var foundUsers = db.Users.Where(u => u.Name.Contains(userInput) && u!=user).ToList();
                var companions = new List<User>();
                var Dialogs = db.Dialogs.Where(d=>d.User1==user || d.User2 == user).ToList();
                Console.WriteLine("_______________________"+Dialogs.Count());
                foreach (var dialog in Dialogs)
                {
                    if (dialog.User1 == user)
                    {
                        companions.Add(dialog.User2);
                        continue;
                    }
                    companions.Add(dialog.User1);
                }
                foundUsers.RemoveAll(u=>companions.Contains(u));
                var result = new JObject
                {
                    { "Users", UsersToJArray(foundUsers )},
                    //{"",userChats(u,db) }
                };

                return result.ToString();
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
            }

            return null;
        }

        private static JObject userData(User u)
        {

            return new JObject
            {
                {"name",u.Name },
                {"photo",u.Photo }
            };
        }
        private static JArray userChats(User u, ApplicationContext db)
        {
            var chats = db.GetChatsForUser(u);
            var chatArray = new JArray();

            foreach (var chat in chats)
            {
                var jObject = new JObject();
                if (db.Dialogs.FirstOrDefault(d => d.Id == chat.Id) != null)
                {
                    var dialog = GetDialog(db, chat.Id);
                    jObject["Id"] = dialog.Id;
                    jObject["Companion"] = dialog.CompaionInfo(u);
                    jObject["Messages"] = MessagesToJArray(dialog.Messages);
                }
                else if(db.Groups.FirstOrDefault(d => d.Id == chat.Id) != null)
                {
                    var group = GetGroup(db, chat.Id);
                    jObject["Id"] = group.Id;
                    jObject["Title"] = group.Title;
                    jObject["Users"] = UsersToJArray(group.Users);
                    jObject["Messages"] = MessagesToJArray(group.Messages);
                }


                chatArray.Add(jObject);
            }
            return chatArray;
        }

        private static Dialog GetDialog(ApplicationContext db, Guid chatId)
        {
            return db.Dialogs
                .Include(d => d.Messages)
                .FirstOrDefault(d => d.Id == chatId);
        }

        private static  Group GetGroup(ApplicationContext db, Guid chatId)
        {
            return db.Groups
                .Include(g => g.Messages)
                .FirstOrDefault(g => g.Id == chatId);
        }


        private static JArray UsersToJArray(List<User> a)
        {
            var arr = new JArray();
            foreach (User u in a)
            {
                var jObject = new JObject();
                jObject["Id"] = u.Id;
                jObject["Name"] = u.Name;
                jObject["Photo"] = u.Photo;
                arr.Add(jObject);
            }
            return arr;
        }
        private static JArray MessagesToJArray(List<Message> a)
        {
            var arr = new JArray();
            foreach (Message m in a)
            {
                var jObject = new JObject();
                jObject["Id"] = m.Id;
                jObject["sender"] = m.Sender.Id;
                jObject["content"] = m.Content;
                jObject["time"] = m.Timestamp;
                arr.Add(jObject);
            }
            return arr;
        }
    }

}