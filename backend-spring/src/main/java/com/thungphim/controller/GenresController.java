package com.thungphim.controller;

import com.thungphim.service.GenresService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/genres")
public class GenresController {

    private final GenresService genresService;

    public GenresController(GenresService genresService) {
        this.genresService = genresService;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> list() {
        return ResponseEntity.ok(genresService.listGenres());
    }

    @GetMapping("/top-with-movies")
    public ResponseEntity<List<Map<String, Object>>> topWithMovies(
            @RequestParam(required = false) Integer limit,
            @RequestParam(name = "movies_per_genre", required = false) Integer moviesPerGenre,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String featured
    ) {
        boolean isFeatured = "1".equals(featured) || "true".equalsIgnoreCase(featured);
        return ResponseEntity.ok(genresService.topWithMovies(limit, moviesPerGenre, type, isFeatured));
    }
}

