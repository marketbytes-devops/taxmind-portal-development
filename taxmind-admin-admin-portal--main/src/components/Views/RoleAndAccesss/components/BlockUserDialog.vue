<template>
  <v-dialog v-model="dialog" max-width="360" persistent>
    <div class="block-user-dialog">
      <!-- Warning Icon Container -->
      <!-- <div class="icon-container">
          <v-img
            :src="require('@/assets/iconsets/Delete.svg')"
            width="58"
            height="58"
          ></v-img>
      </div> -->

      <!-- Block Icon -->
      <div class="block-icon-container">
        <v-img
          :src="require('@/assets/iconsets/block.png')"
          width="58"
          height="58"
        ></v-img>
      </div>

      <!-- Title -->
      <div class="dialog-title">
        {{ title }}
      </div>

      <!-- Description -->
      <div class="dialog-description">
        {{ description }}
      </div>

      <!-- Action Buttons -->
      <div class="button-container">
        <!-- Cancel Button -->
        <v-btn
          class="cancel-btn"
          width="152"
          height="42"
          depressed
          :ripple="false"
          @click="handleCancel"
        >
          <span class="cancel-text">{{ cancelText }}</span>
        </v-btn>

        <!-- Action Button (Block/Delete) -->
        <v-btn
          class="action-btn"
          width="152"
          height="42"
          depressed
          :ripple="false"
          :style="{ background: actionColor + ' !important' }"
          @click="handleAction"
        >
          <span class="action-text">{{ actionText }}</span>
        </v-btn>
      </div>
    </div>
  </v-dialog>
</template>

<script>
export default {
  name: "BlockUserDialog",
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: "Are you sure you want to Block?",
    },
    description: {
      type: String,
      default:
        "User data will be permanently blocked. Do you still want to proceed?",
    },
    cancelText: {
      type: String,
      default: "Cancel",
    },
    actionText: {
      type: String,
      default: "Block",
    },
    actionColor: {
      type: String,
      default: "#D53E3E", // Red for block/delete actions
    },
  },
  computed: {
    dialog: {
      get() {
        return this.value;
      },
      set(val) {
        this.$emit("input", val);
      },
    },
  },
  methods: {
    handleCancel() {
      this.$emit("cancel");
      this.dialog = false;
    },
    handleAction() {
      this.$emit("confirm");
      this.dialog = false;
    },
  },
};
</script>

<style scoped>
.block-user-dialog {
  background: white;
  border-radius: 8px;
  width: 360px;
  position: relative;
  padding: 44px 37.5px 25px 37.5px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Warning Icon Container */
.icon-container {
  position: absolute;
  top: 44px;
  left: 50%;
  transform: translateX(-50%);
}

.warning-icon-bg {
  width: 58px;
  height: 58px;
  background: rgba(213, 62, 62, 0.1);
  border-radius: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Block Icon Container */
.block-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

/* Title */
.dialog-title {
  font-family: "DM Sans", sans-serif;
  font-weight: 600;
  /* SemiBold */
  font-size: 16px;
  line-height: normal;
  text-align: center;
  color: #000000;
  /* margin-top: 74px; */
  /* 44px top + 58px icon + 16px gap */
  margin-bottom: 22px;
  white-space: pre-line;
}

/* Description */
.dialog-description {
  font-family: "DM Sans", sans-serif;
  font-weight: 400;
  /* Regular */
  font-size: 14px;
  line-height: normal;
  text-align: center;
  color: #5f5f5f;
  margin-bottom: 28px;
  width: 285px;
  white-space: pre-line;
}

/* Button Container */
.button-container {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* Cancel Button */
.cancel-btn {
  background: #ffffff !important;
  border: 1px solid #e0e0e0 !important;
  border-radius: 6px !important;
  box-shadow: none !important;
}

.cancel-text {
  font-family: "DM Sans", sans-serif;
  font-weight: 500;
  /* Medium */
  font-size: 16px;
  line-height: normal;
  color: #5f5f5f;
  text-transform: none;
}

/* Action Button */
.action-btn {
  border-radius: 6px !important;
  box-shadow: none !important;
}

.action-text {
  font-family: "DM Sans", sans-serif;
  font-weight: 500;
  /* Medium */
  font-size: 16px;
  line-height: normal;
  color: #ffffff;
  text-transform: none;
}

/* Remove default Vuetify button styles */
.v-btn {
  min-width: unset !important;
  padding: 0 !important;
}

.v-btn:before {
  display: none !important;
}
</style>