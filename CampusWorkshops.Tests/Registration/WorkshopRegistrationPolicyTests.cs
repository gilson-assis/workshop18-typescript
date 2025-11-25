
// CampusWorkshops.Tests/Registration/RegistrationPolicyTests.cs
using System;
using CampusWorkshops.Api.Domain.Registration;
using CampusWorkshops.Api.Models; // Workshop do seu projeto
using Microsoft.Extensions.Time.Testing;
using Xunit;

namespace CampusWorkshops.Tests.Registration
{
    public class RegistrationPolicyTests
    {
        private static (RegistrationPolicy Policy, FakeTimeProvider Time) BuildSut(DateTimeOffset nowUtc)
        {
            var time = new FakeTimeProvider(nowUtc.UtcDateTime);
            var policy = new RegistrationPolicy(time);
            return (policy, time);
        }

        private static Workshop W(int capacity, DateTimeOffset startAt)
            => new Workshop
            {
                Id = Guid.NewGuid(),
                Title = "Qualquer título",
                StartAt = startAt.UtcDateTime,     // se seu StartAt for DateTimeOffset, use .StartAt = startAt
                EndAt = startAt.UtcDateTime.AddHours(2),
                Capacity = capacity,
                IsOnline = true
            };

        [Fact]
        public void Rejects_When_Window_Closed_At_24h()
        {
            // Arrange
            var now = DateTimeOffset.Parse("2025-03-01T12:00:00Z");
            var (policy, _) = BuildSut(now);
            var w = W(capacity: 10, startAt: now.AddHours(RegistrationPolicy.CloseWindowLeadHours));
            var enrolled = 0;

            // Act
            var decision = policy.Decide(w, enrolled);

            // Assert
            Assert.Equal(RegistrationOutcome.Rejected, decision.Outcome);
            Assert.Contains("Registration window closed.", decision.Reasons);
        }

        [Fact]
        public void Accepts_When_Seats_Available()
        {
            // Arrange
            var now = DateTimeOffset.Parse("2025-03-01T12:00:00Z");
            var (policy, _) = BuildSut(now);
            var w = W(capacity: 10, startAt: now.AddHours(36));
            var enrolled = 9;

            // Act
            var decision = policy.Decide(w, enrolled);

            // Assert
            Assert.Equal(RegistrationOutcome.Accepted, decision.Outcome);
            Assert.Contains("Accepted", decision.Reasons);
        }

        [Fact]
        public void Rejects_When_Full()
        {
            // Arrange
            var now = DateTimeOffset.Parse("2025-03-01T12:00:00Z");
            var (policy, _) = BuildSut(now);
            var w = W(capacity: 10, startAt: now.AddHours(36));
            var enrolled = 10;

            // Act
            var decision = policy.Decide(w, enrolled);

            // Assert
            Assert.Equal(RegistrationOutcome.Rejected, decision.Outcome);
            Assert.Contains("No seats available.", decision.Reasons);
        }

        [Theory]
        [InlineData(30, RegistrationOutcome.Accepted)]
        [InlineData(24, RegistrationOutcome.Rejected)]
        [InlineData(10, RegistrationOutcome.Rejected)]
        public void Window_Rules(int hoursToStart, RegistrationOutcome expected)
        {
            // Arrange
            var now = DateTimeOffset.Parse("2025-03-01T12:00:00Z");
            var (policy, _) = BuildSut(now);
            var w = W(capacity: 5, startAt: now.AddHours(hoursToStart));
            var enrolled = 0;

            // Act
            var decision = policy.Decide(w, enrolled);

            // Assert
            Assert.Equal(expected, decision.Outcome);
        }
    }
}
