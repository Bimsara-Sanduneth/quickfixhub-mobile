package com.quickfixhub.backend.notification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

	// Capped rather than paged - this is a lightweight in-app list, not an archive; the mobile
	// client has no "load more" for it.
	List<Notification> findTop50ByRecipientIdOrderByCreatedAtDesc(UUID recipientId);

	long countByRecipientIdAndReadFalse(UUID recipientId);

	// Bulk update, bypasses the persistence context - fine here since nothing in the same request
	// re-reads these rows afterwards. Needs @Transactional on the calling controller method, same
	// as any other derived/@Modifying write - see ProviderAvailabilityController's comment on why.
	@Modifying
	@Query("update Notification n set n.read = true where n.recipient.id = :recipientId and n.read = false")
	void markAllRead(@Param("recipientId") UUID recipientId);
}
