package com.thungphim.controller;

import com.thungphim.entity.Episode;
import com.thungphim.repository.EpisodeRepository;
import com.thungphim.security.JwtAuthFilter;
import com.thungphim.service.UploadService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

@RestController
@RequestMapping("/api/upload")
public class UploadController {

    private final UploadService uploadService;
    private final EpisodeRepository episodeRepository;

    public UploadController(UploadService uploadService, EpisodeRepository episodeRepository) {
        this.uploadService = uploadService;
        this.episodeRepository = episodeRepository;
    }

    private static JwtAuthFilter.JwtUser requireUser() {
        JwtAuthFilter.JwtUser u = JwtAuthFilter.getCurrentUser();
        if (u == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Thiếu token");
        return u;
    }

    private static void requireAdmin() {
        JwtAuthFilter.JwtUser u = requireUser();
        if (!u.isAdmin) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ admin mới được phép thao tác");
    }

    @PostMapping("/video")
    public ResponseEntity<Map<String, String>> uploadVideo(@RequestParam(value = "video", required = false) MultipartFile video) {
        requireAdmin();
        try {
            String url = uploadService.saveVideo(video);
            if (url == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không có file nào được upload");
            return ResponseEntity.ok(Map.of("video_url", url));
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    @PostMapping("/image")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam(value = "image", required = false) MultipartFile image) {
        requireAdmin();
        try {
            String url = uploadService.saveImage(image);
            if (url == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không có file nào được upload");
            return ResponseEntity.ok(Map.of("image_url", url));
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    @PostMapping("/episode-video/{episodeId}")
    public ResponseEntity<Map<String, Object>> uploadEpisodeVideo(
            @PathVariable Integer episodeId,
            @RequestParam(value = "video", required = false) MultipartFile video
    ) {
        requireAdmin();
        try {
            String url = uploadService.saveVideo(video);
            if (url == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không có file nào được upload");

            Episode ep = episodeRepository.findById(episodeId).orElse(null);
            if (ep == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Episode not found");

            ep.setVideoUrl(url);
            episodeRepository.save(ep);

            return ResponseEntity.ok(Map.of(
                    "episode_id", episodeId,
                    "video_url", url
            ));
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    @PostMapping("/episode-thumbnail-from-video/{episodeId}")
    public ResponseEntity<Map<String, Object>> thumbnailFromVideo(@PathVariable Integer episodeId) {
        requireAdmin();
        try {
            Episode ep = episodeRepository.findById(episodeId).orElse(null);
            if (ep == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Episode not found");

            String videoUrl = ep.getVideoUrl();
            if (videoUrl == null || videoUrl.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tập này chưa có video để cắt ảnh bìa");
            }
            String lower = videoUrl.toLowerCase();
            if (lower.startsWith("http://") || lower.startsWith("https://")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ hỗ trợ video lưu local trong thư mục uploads");
            }

            String rel = videoUrl.startsWith("/") ? videoUrl.substring(1) : videoUrl;
            Path videoPath = Paths.get(rel).toAbsolutePath().normalize();

            String fileName = "ep-" + episodeId + "-" + System.currentTimeMillis() + "-" + ThreadLocalRandom.current().nextInt(1_000_000) + ".jpg";
            String imageUrl = "/uploads/images/" + fileName;
            String relOut = imageUrl.startsWith("/") ? imageUrl.substring(1) : imageUrl;
            Path outputPath = Paths.get(relOut).toAbsolutePath().normalize();

            int randomSeconds = 5 + ThreadLocalRandom.current().nextInt(20);

            ProcessBuilder pb = new ProcessBuilder(
                    "ffmpeg",
                    "-ss", String.valueOf(randomSeconds),
                    "-i", videoPath.toString(),
                    "-frames:v", "1",
                    "-q:v", "2",
                    outputPath.toString()
            );
            pb.redirectErrorStream(true);
            Process p = pb.start();
            int code = p.waitFor();
            if (code != 0) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không tạo được ảnh bìa từ video");
            }

            ep.setThumbnailUrl(imageUrl);
            episodeRepository.save(ep);

            return ResponseEntity.ok(Map.of(
                    "episode_id", episodeId,
                    "image_url", imageUrl
            ));
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không tạo được ảnh bìa từ video");
        }
    }
}

