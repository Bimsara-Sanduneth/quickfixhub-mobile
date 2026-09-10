package com.quickfixhub.backend.provider;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;
import java.util.UUID;

// One row per (provider, document type) - re-uploading a type overwrites the existing row
// (MyProviderProfileController.uploadDocument) rather than keeping old submissions around, and
// resets its status back to PENDING so a previously-rejected document goes back into the queue.
@Entity
@Table(name = "provider_documents", uniqueConstraints = @UniqueConstraint(columnNames = { "provider_profile_id", "document_type" }))
public class ProviderDocument {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@ManyToOne(optional = false)
	@JoinColumn(name = "provider_profile_id", nullable = false)
	private ProviderProfile providerProfile;

	@Enumerated(EnumType.STRING)
	@Column(name = "document_type", nullable = false)
	private DocumentType documentType;

	// Same data:image/...;base64,... convention as User.photoDataUri - stored directly, no object
	// storage wired up.
	@Column(name = "file_data_uri", nullable = false, columnDefinition = "TEXT")
	private String fileDataUri;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private DocumentStatus status = DocumentStatus.PENDING;

	// Admin's per-document note (e.g. "expired", "unreadable, please retake") - shown to the
	// provider alongside the document.
	@Column(name = "review_note", columnDefinition = "TEXT")
	private String reviewNote;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected ProviderDocument() {
	}

	public ProviderDocument(ProviderProfile providerProfile, DocumentType documentType, String fileDataUri) {
		this.providerProfile = providerProfile;
		this.documentType = documentType;
		this.fileDataUri = fileDataUri;
	}

	@PrePersist
	void onCreate() {
		Instant now = Instant.now();
		createdAt = now;
		updatedAt = now;
	}

	@PreUpdate
	void onUpdate() {
		updatedAt = Instant.now();
	}

	public UUID getId() {
		return id;
	}

	public ProviderProfile getProviderProfile() {
		return providerProfile;
	}

	public DocumentType getDocumentType() {
		return documentType;
	}

	public String getFileDataUri() {
		return fileDataUri;
	}

	public void setFileDataUri(String fileDataUri) {
		this.fileDataUri = fileDataUri;
	}

	public DocumentStatus getStatus() {
		return status;
	}

	public void setStatus(DocumentStatus status) {
		this.status = status;
	}

	public String getReviewNote() {
		return reviewNote;
	}

	public void setReviewNote(String reviewNote) {
		this.reviewNote = reviewNote;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}
}
