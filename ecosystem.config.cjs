module.exports = {
  apps: [{
    name: "divyanshi-main",
    script: "./dist/index.js",
    env: {
      NODE_ENV: "production",
      PORT: "5001",
      HOST: "0.0.0.0",
      SESSION_SECRET: "solar_pm_mitra_secret_2026",
      DATABASE_URL: "postgresql://suryamitra:SuryaStaging%402025@172.17.0.1:5432/suryamitra_staging?sslmode=disable&connection_limit=10&pool_timeout=30",
      OPENAI_API_KEY: "YOUR_OPENAI_API_KEY"
    }
  }]
}
