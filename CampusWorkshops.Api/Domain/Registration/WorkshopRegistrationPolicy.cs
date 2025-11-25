using System;
using System.Collections.Generic;
using CampusWorkshops.Api.Models; // <-- Workshop do seu projeto

namespace CampusWorkshops.Api.Domain.Registration
{
    public enum RegistrationOutcome { Accepted, Rejected }

    public sealed record RegistrationDecision(RegistrationOutcome Outcome, IReadOnlyList<string> Reasons);

    /// <summary>
    /// Regra simples de registro para Workshop.
    /// Regras:
    /// - Janela fecha quando faltar <= 24h para o StartAt.
    /// - Se há assentos (Capacity - enrolled > 0) → Accepted; senão → Rejected.
    /// </summary>
    public sealed class RegistrationPolicy
    {
        public const int CloseWindowLeadHours = 24;

        private readonly TimeProvider _time;

        public RegistrationPolicy(TimeProvider time)
        {
            _time = time ?? throw new ArgumentNullException(nameof(time));
        }

        /// <summary>
        /// Decide usando apenas o Workshop e o número ATUAL de inscritos (enrolled).
        /// </summary>
        public RegistrationDecision Decide(Workshop w, int enrolled)
        {
            if (w is null) throw new ArgumentNullException(nameof(w));
            var reasons = new List<string>();

            // (1) Janela de inscrição
            var now = _time.GetUtcNow();
            // Se StartAt for DateTime (não Offset) no seu modelo, troque por:
            // var startAtUtc = DateTime.SpecifyKind(w.StartAt, DateTimeKind.Utc);
            // if (startAtUtc - now <= TimeSpan.FromHours(CloseWindowLeadHours)) { ... }
            if (w.StartAt - now <= TimeSpan.FromHours(CloseWindowLeadHours))
            {
                reasons.Add("Registration window closed.");
                return new RegistrationDecision(RegistrationOutcome.Rejected, reasons);
            }

            // (2) Capacidade
            var seatsLeft = w.Capacity - enrolled;
            if (seatsLeft > 0)
            {
                reasons.Add("Accepted");
                return new RegistrationDecision(RegistrationOutcome.Accepted, reasons);
            }

            reasons.Add("No seats available.");
            return new RegistrationDecision(RegistrationOutcome.Rejected, reasons);
        }
    }
}

