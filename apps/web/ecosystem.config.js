module.exports = {
  apps: [
    {
      name: "logtail-web",
      script: "node_modules/.bin/next",
      args: "start",
      instances: "max",
      exec_mode: "cluster",
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        NEXT_PUBLIC_API_URL: "https://skopos.ink/api",
        PORT: 3000,
      },
      error_file: "/root/.pm2/logs/logtail-web-error.log",
      out_file: "/root/.pm2/logs/logtail-web-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
