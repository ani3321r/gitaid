package gitaid.backend.dto;

import java.time.Instant;
import java.util.UUID;

import gitaid.backend.entity.IndexStatus;

public record IndexStatusResponse(
  UUID repositoryId,
  IndexStatus IndexStatus,
  int filesTotal,
  int filesProcessed,
  int chunkCount,
  Instant indexedAt,
  String erroMessage)
{  
}
