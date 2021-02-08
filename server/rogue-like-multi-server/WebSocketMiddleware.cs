using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace rogue_like_multi_server
{
    public class WebSocketsMiddleware
    {
        private readonly RequestDelegate _next;

        public WebSocketsMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task Invoke(HttpContext httpContext)
        {
            var request = httpContext.Request;

            // web sockets cannot pass headers so we must take the access token from query param and
            // add it to the header before authentication middleware runs
            if (request.Path.StartsWithSegments("/hub", StringComparison.OrdinalIgnoreCase) &&
                request.Query.TryGetValue("access_token", out var accessToken))
            {
                if (!request.Headers.TryGetValue("Authorization", out var auth))
                    request.Headers.Add("Authorization", $"Basic {accessToken}");
            }

            await _next(httpContext);
        }
    }
}