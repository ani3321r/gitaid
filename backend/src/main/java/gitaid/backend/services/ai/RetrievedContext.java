package gitaid.backend.services.ai;

import java.util.List;

import gitaid.backend.dto.CitationDto;

public record RetrievedContext(List<CitationDto> citations,String contextText) {
}