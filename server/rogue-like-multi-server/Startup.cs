using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using rogue_like_multi_server.Hubs;

namespace rogue_like_multi_server
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddCors(options =>
            {
                options.AddPolicy("CorsPolicy",
                    builder => builder.AllowAnyOrigin()
                        .AllowAnyMethod()
                        .AllowAnyHeader());
            });

            services.AddControllers();

            // configure basic authentication
            services.AddAuthentication("BasicAuthentication")
                .AddScheme<AuthenticationSchemeOptions, BasicAuthenticationHandler>("BasicAuthentication", null);

            services.AddSignalR();

            // Dependencies Injection
            services.AddSingleton<IUserIdProvider, UserIdProvider>();
            services.AddSingleton<IGameService, GameService>();
            services.AddSingleton<IBoardStateService, BoardStateService>();
            services.AddScoped<IUserService, UserService>();
            services.AddSingleton<IMapService, MapService>();

            // Hosted Service
            services.AddHostedService<GameHostedService>();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseHsts();
                app.UseHttpsRedirection();
            }

            var options = new DefaultFilesOptions();
            options.DefaultFileNames.Clear();
            options.DefaultFileNames.Add("index.html");
            app.UseDefaultFiles(options);
            app.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = new PhysicalFileProvider(
                    Path.GetFullPath(Path.Combine(env.ContentRootPath, "../../client/dist"))),
            });

            app.UseCors("CorsPolicy");
            app.UseRouting();

            app.UseMiddleware<WebSocketsMiddleware>();
            app.UseAuthentication();
            app.UseAuthorization();

            app.UseEndpoints(endpoints => { endpoints.MapControllers(); });

            app.UseSignalR(endpoints =>
            {
                endpoints.MapHub<ChatHub>("/hub");
            });

            app.Run(context =>
            {
                context.Response.Redirect("/index.html");
                return Task.FromResult<object>(null);
            });
        }
    }
}