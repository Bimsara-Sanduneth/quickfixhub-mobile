package com.quickfixhub.backend.payment;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

	Optional<Payment> findByBookingId(UUID bookingId);

	// Fetches booking + its customer/providerProfile/service eagerly - the admin list and the
	// receipt view both need those to render, and this avoids an N+1 per row.
	@Query("""
			SELECT p FROM Payment p
			JOIN FETCH p.booking b
			JOIN FETCH b.customer
			JOIN FETCH b.providerProfile
			JOIN FETCH b.providerService ps
			JOIN FETCH ps.service
			ORDER BY p.paidAt DESC
			""")
	Page<Payment> findAllWithBookingDetails(Pageable pageable);

	@Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p")
	BigDecimal sumAmount();

	@Query("SELECT COALESCE(SUM(p.refundAmount), 0) FROM Payment p WHERE p.refundAmount IS NOT NULL")
	BigDecimal sumRefunded();

	long countByStatus(PaymentStatus status);
}
