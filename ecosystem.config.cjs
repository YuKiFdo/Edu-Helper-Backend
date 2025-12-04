module.exports = {
  apps: [
    {
      name: 'backend',
      script: 'dist/main.js',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
    },
  ],
};


