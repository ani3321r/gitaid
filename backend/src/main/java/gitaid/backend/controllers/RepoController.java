package gitaid.backend.controllers;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import gitaid.backend.dto.IndexStatusResponse;
import gitaid.backend.dto.RepositoryResponse;
import gitaid.backend.security.CurrentUser;
import gitaid.backend.services.RepoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;


@RestController 
@RequestMapping ("/api/repos")
@RequiredArgsConstructor 
public class RepoController {
  private final CurrentUser currentUser;
  private final RepoService repoService;

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
  
  @GetMapping("/{id}/status")
  public IndexStatusResponse status(@PathVariable UUID id) {
    UUID userId = currentUser.require().getId();  
    return repoService.status(id, userId);
  }
  
}
