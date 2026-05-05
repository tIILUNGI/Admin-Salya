using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Salya.Api.Models.Admin;
using System.Collections.Generic;
using System.Linq;

namespace Salya.Api.Controllers.Admin
{
    [Authorize(Roles = "SUPER_ADMIN")]
    [ApiController]
    [Route("admin")]
    public class AdminController : ControllerBase
    {
        // dashboard
        [HttpGet("dashboard")]
        public IActionResult GetDashboard()
        {
            // Logic to fetch global metrics
            return Ok(new { 
                metrics = new { /* ... metrics ... */ },
                revenueChart = new[] { /* ... chart data ... */ } 
            });
        }

        // companies
        [HttpGet("companies")]
        public IActionResult GetCompanies() { /* logic */ return Ok(); }

        [HttpPost("companies/{id}/toggle-status")]
        public IActionResult ToggleCompanyStatus(int id) { /* logic */ return Ok(); }

        // users
        [HttpGet("users")]
        public IActionResult GetUsers() { /* logic */ return Ok(); }

        // subscriptions
        [HttpGet("subscriptions")]
        public IActionResult GetSubscriptions() { /* logic */ return Ok(); }

        // payments
        [HttpGet("payments")]
        public IActionResult GetPayments() { /* logic */ return Ok(); }
        
        [HttpPost("payments/{id}/mark-completed")]
        public IActionResult MarkPaymentCompleted(int id) { /* logic */ return Ok(); }

        // plans
        [HttpGet("plans")]
        public IActionResult GetPlans() { /* logic */ return Ok(); }

        [HttpPost("plans")]
        public IActionResult CreatePlan([FromBody] Plan plan) { /* logic */ return Ok(); }

        // logs
        [HttpGet("logs")]
        public IActionResult GetLogs() { /* logic */ return Ok(); }
    }
}
