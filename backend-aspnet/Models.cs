using System;
using System.ComponentModel.DataAnnotations;

namespace Salya.Api.Models.Admin
{
    public class Plan
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; } // Mensal, Semestral, Anual
        public decimal Price { get; set; }
        public int DurationDays { get; set; }
        public bool IsActive { get; set; }
    }

    public class Subscription
    {
        public int Id { get; set; }
        public int CompanyId { get; set; }
        public int PlanId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsTrial { get; set; }
        public string Status { get; set; } // active, expired, pending, suspended
    }

    public class Payment
    {
        public int Id { get; set; }
        public int SubscriptionId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } // MCX Express, Unitel Money
        public DateTime PaymentDate { get; set; }
        public string Status { get; set; } // completed, pending, failed
    }

    public class AdminLog
    {
        public int Id { get; set; }
        public string Action { get; set; }
        public string PerformedBy { get; set; }
        public DateTime Date { get; set; }
    }
}
