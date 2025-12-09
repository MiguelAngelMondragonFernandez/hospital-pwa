package com.example.demo.Notification.Service;

import com.example.demo.Notification.Entity.PushSubscription;
import com.example.demo.Notification.Repository.PushSubscriptionRepository;
import com.example.demo.User.Entity.User;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;

@Service
@Slf4j
public class NotificationService {

    private final PushSubscriptionRepository repository;

    public NotificationService(PushSubscriptionRepository repository) {
        this.repository = repository;
    }

    @PostConstruct
    public void init() {
        try {
            // TODO: User must place 'serviceAccountKey.json' in src/main/resources
            // If checking fails, we log an error but don't crash app start for other
            // features
            ClassPathResource resource = new ClassPathResource("serviceAccountKey.json");
            if (resource.exists()) {
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(resource.getInputStream()))
                        .build();

                if (FirebaseApp.getApps().isEmpty()) {
                    FirebaseApp.initializeApp(options);
                    log.info("Firebase Application Initialized");
                }
            } else {
                log.warn(
                        "WARNING: serviceAccountKey.json not found in resources. Firebase Notifications will NOT work.");
            }
        } catch (IOException e) {
            log.error("Error initializing Firebase", e);
        }
    }

    public void subscribe(User user, String token) {
        if (repository.findByToken(token).isPresent()) {
            return;
        }
        PushSubscription subscription = new PushSubscription();
        subscription.setUser(user);
        subscription.setToken(token);
        repository.save(subscription);
    }

    public void sendToUser(User user, String title, String body) {
        List<PushSubscription> subscriptions = repository.findByUser(user);
        for (PushSubscription sub : subscriptions) {
            sendNotification(sub, title, body);
        }
    }

    private void sendNotification(PushSubscription sub, String title, String body) {
        try {
            Message message = Message.builder()
                    .setToken(sub.getToken())
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build())
                    .putData("title", title)
                    .putData("body", body)
                    .putData("click_action", "FLUTTER_NOTIFICATION_CLICK") // Compatibility
                    .build();

            String response = FirebaseMessaging.getInstance().send(message);
            log.info("Successfully sent message: " + response);
        } catch (Exception e) {
            log.error("Failed to send Firebase notification", e);
            if (e.getMessage().contains("Requested entity was not found")
                    || e.getMessage().contains("registration-token-not-registered")) {
                repository.delete(sub);
            }
        }
    }

    // Kept for compatibility if used elsewhere, but VAPID key is no longer needed
    public String getPublicKey() {
        return "";
    }
}
