﻿using Microsoft.EntityFrameworkCore;
using webapi.Entities;
using webapi.Utilities;

namespace webapi.Services
{
    public class UserService
    {
        private readonly ApplicationContext _db;

        public UserService(ApplicationContext db)
        {
            _db = db;
        }

        public async Task<User> GetUserFromToken(string token)
        {
            JWTCreator.DecodeToken(token, out string login);
            return await _db.Clients.FirstOrDefaultAsync(u => u.Login == login);
        }
    }
}
