package com.tai.shop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.List;

@SpringBootApplication
public class ShopApplication {

	public static void main(String[] args) {
		loadDotEnv();
		SpringApplication.run(ShopApplication.class, args);
	}

	private static void loadDotEnv() {
		File[] candidateFiles = {
				new File(".env"),
				new File("../.env"),
				new File("../../.env")
		};

		for (File file : candidateFiles) {
			if (file.exists() && file.isFile()) {
				try {
					List<String> lines = Files.readAllLines(file.toPath());
					for (String line : lines) {
						String trimmed = line.trim();
						if (trimmed.isEmpty() || trimmed.startsWith("#") || !trimmed.contains("=")) {
							continue;
						}
						int eqIdx = trimmed.indexOf('=');
						String key = trimmed.substring(0, eqIdx).trim();
						String value = trimmed.substring(eqIdx + 1).trim();
						if (System.getProperty(key) == null && System.getenv(key) == null) {
							System.setProperty(key, value);
						}
					}
					break;
				} catch (IOException ignored) {
				}
			}
		}
	}

}
