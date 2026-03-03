<template>
  <div class="empty-state-container">
    <div class="empty-state-content">
      <!-- No Category Image -->
      <div class="empty-icon">
        <img
          src="@/assets/iconsets/noCategory.png"
          alt="No Categories"
          class="no-category-image"
        />
      </div>

      <!-- Title -->
      <h2 class="empty-title">No categories</h2>

      <!-- Description -->
      <p class="empty-description">
        Please add a category to proceed the questionnaire
      </p>

      <!-- Action Button -->
      <div class="action-button">
        <v-btn
          color="#1A73E9"
          class="add-category-btn"
          @click="$emit('addCategory')"
        >
          <v-icon left size="20" color="white">mdi-plus</v-icon>
          Add category
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "EmptyStateCategories",
  emits: ["addCategory"],
};
</script>

<style scoped>
/* Full screen empty state styles */
.empty-state-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  width: 100%;
  padding: 40px 20px;
}

.empty-state-content {
  text-align: center;
  width: 100%;
  max-width: 400px;
  position: relative;
}

/* No Category Image */
.empty-icon {
  margin-bottom: 24px;
}

.no-category-image {
  width: 58px;
  height: 58px;
  object-fit: contain;
}

/* Title - updated for full screen layout */
.empty-title {
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  font-weight: 600; /* SemiBold */
  color: #000000;
  line-height: 1.4;
  margin: 0 0 8px 0;
  text-align: center;
}

/* Description - updated for full screen layout */
.empty-description {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400; /* Regular */
  color: #5F5F5F;
  line-height: 1.5;
  margin: 0 0 32px 0;
  text-align: center;
  /* max-width: 300px; */
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 32px;
}

/* Action Button Container */
.action-button {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Add Category Button - filled blue style */
.add-category-btn {
  font-family: "DM Sans", sans-serif !important;
  font-weight: 500 !important; /* Medium */
  font-size: 14px !important;
  color: white !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  line-height: 24px !important;
  height: 36px !important;
  min-width: 150px !important;
  padding: 0 16px !important;
  background-color: #1a73e9 !important;
  border: none !important;
  border-radius: 4px !important;
  box-shadow: 0 2px 4px rgba(26, 115, 233, 0.2) !important;
}

.add-category-btn:hover {
  background-color: #1565c0 !important;
  box-shadow: 0 4px 8px rgba(26, 115, 233, 0.3) !important;
}

.add-category-btn:before {
  display: none !important;
}

/* Remove default Vuetify button styles */
.add-category-btn .v-btn__content {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .empty-state-container {
    min-height: 50vh;
    padding: 20px 16px;
  }

  .empty-title {
    font-size: 1px;
  }

  .empty-description {
    font-size: 13px;
  }

  .no-category-image {
    width: 58px;
    height: 58px;
  }
}

/* Animation for smooth entrance */
.empty-state-content {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>