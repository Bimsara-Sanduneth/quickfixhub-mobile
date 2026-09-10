package com.quickfixhub.backend.messaging;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {

	List<Message> findByBookingIdOrderByCreatedAtAsc(UUID bookingId);

	Optional<Message> findFirstByBookingIdOrderByCreatedAtDesc(UUID bookingId);
}
