using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;
using System.Linq;
using System.Security.Claims;

namespace Salya.Api.Middleware
{
    public class SubscriptionMiddleware
    {
        private readonly RequestDelegate _next;

        public SubscriptionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Se for rota de admin ou login, ignorar check
            if (context.Request.Path.StartsWithSegments("/admin") || context.Request.Path.StartsWithSegments("/auth"))
            {
                await _next(context);
                return;
            }

            // Pegar CompanyId do usuário autenticado (JWT Claim)
            var companyIdClaim = context.User.FindFirst("CompanyId")?.Value;

            if (companyIdClaim != null)
            {
                // TODO: Verificar na DB se a empresa tem subscrição ativa
                // bool hasActiveSubscription = _db.Subscriptions.Any(s => s.CompanyId == int.Parse(companyIdClaim) && s.Status == "active" && s.EndDate >= DateTime.Now);
                bool hasActiveSubscription = true; // Placeholder

                if (!hasActiveSubscription)
                {
                    context.Response.StatusCode = 403;
                    await context.Response.WriteAsync("Sua subscrição expirou. Por favor, regularize seu pagamento para continuar acessando o Salya.");
                    return;
                }
            }

            await _next(context);
        }
    }
}
