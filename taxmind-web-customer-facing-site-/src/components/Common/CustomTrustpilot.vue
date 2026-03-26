<template>

  <a href="https://www.trustpilot.com/review/taxmind.ie" target="_blank" rel="noopener" class="trustpilot-link">
    <div class="trustpilot-container">
      <div class="trustpilot-icon">
        <img src="./../../assets/trustpilot-img.png" alt="Trustpilot" class="trustpilot-logo" />
      </div>

    </div>
  </a>

</template>

<script>
export default {
  name: 'CustomTrustpilot',
  data() {
    return {}
  }
}
</script>

<style scoped>
.custom-trustpilot {
  margin-top: 16px;
}

.trustpilot-link {
  text-decoration: none;
  color: inherit;
  display: block;
  transition: transform 0.2s ease;
}

.trustpilot-link:hover {
  transform: translateY(-2px);
}

.trustpilot-container {
  display: flex;
  align-items: center;
  /* background: rgba(255, 255, 255, 0.1); */
  border-radius: 8px;
  /* padding: 12px; */
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

/* .trustpilot-container:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
} */

.trustpilot-icon {
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  /* width: 120px; */
  height: 32px;
  background: transparent;
  border-radius: 6px;
}

.trustpilot-logo {
  position: relative;
  width: 100%;
  height: auto;
  max-height: 35px;
  margin-top: 15px;
  -o-object-fit: contain;
  object-fit: contain;
  right: 4px;
}

.trustpilot-content {
  flex: 1;
}

.trustpilot-brand {
  margin-bottom: 4px;
}

.trustpilot-text {
  font-family: DMSans, sans-serif;
  font-weight: 700;
  font-size: 16px;
  color: #ffffff;
  letter-spacing: 0.5px;
}

.trustpilot-rating {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stars {
  display: flex;
  gap: 2px;
}

.rating-text {
  font-family: DMSans, sans-serif;
  font-weight: 500;
  font-size: 14px;
  color: #ffffff;
  opacity: 0.9;
}

/* Mobile responsiveness */
@media (max-width: 600px) {
  .trustpilot-container {
    /* padding: 10px; */
    margin-top: 10px;
  }

  .trustpilot-icon {
    width: 157px;
    height: 7px;
    margin-right: 10px;
  }

  .trustpilot-text {
    font-size: 14px;
  }

  .rating-text {
    font-size: 12px;
  }

  .trustpilot-logo {
    position: relative;
    width: 100%;
    height: auto;
    max-height: 35px;
    margin-top: 15px;
    -o-object-fit: contain;
    object-fit: contain;
    right: 15px;
  }

  .stars svg {
    width: 14px;
    height: 14px;
  }
}
</style>
