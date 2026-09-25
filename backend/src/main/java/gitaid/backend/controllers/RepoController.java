package gitaid.backend.controllers;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import gitaid.backend.dto.IndexStatusResponse;
import gitaid.backend.dto.RepositoryResponse;
import gitaid.backend.entity.Repository;
import gitaid.backend.security.CurrentUser;
import gitaid.backend.services.RepoService;
import gitaid.backend.services.indexing.IndexingService;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;



@RestController 
@RequestMapping ("/api/repos")
@RequiredArgsConstructor 
public class RepoController {
  private final CurrentUser currentUser;
  private final RepoService repoService;

  private final IndexingService indexingService;

  @GetMapping
  public List<RepositoryResponse> list(
    @RequestParam(name="refresh", defaultValue="true") boolean refresh
  ){
    UUID userId = currentUser.require().getId();
    if(refresh){
      return repoService.syncAndListRepo(userId);
    }
    return repoService.listStored(userId);
  }

  @GetMapping("/{id}")
  public RepositoryResponse get(@PathVariable UUID id) {
    UUID userId = currentUser.require().getId();  
    return repoService.toResponse(repoService.requireOwned(id, userId));
  }

  @PostMapping("/{id}/index")
  public ResponseEntity<RepositoryResponse> index(@PathVariable UUID id) {
    UUID userId = currentUser.require().getId();
    Repository repo = indexingService.startIndexing(id, userId);
    indexingService.indexAsync(id, userId);
    return ResponseEntity.status(HttpStatus.ACCEPTED).body(repoService.toResponse(repo));
  }
  
  @GetMapping("/{id}/status")
  public IndexStatusResponse status(@PathVariable UUID id) {
    UUID userId = currentUser.require().getId();  
    return repoService.status(id, userId);
  }
  
}
