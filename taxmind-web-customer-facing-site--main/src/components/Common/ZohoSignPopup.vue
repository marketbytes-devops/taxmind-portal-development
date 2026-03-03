<template>
  <v-dialog
    v-model="visible"
    persistent
    max-width="580"
    aria-label="Account activation required dialog"
  >
    <v-card class="zoho-card" role="dialog" aria-modal="true">
      <div class="zoho-content">
        <img :src="iconSrc" alt="Zoho confirmation" class="zoho-icon" />

        <h3 class="zoho-title">Account Activation Required</h3>

        <div class="zoho-description">
          <p class="zoho-text-line">
            We've sent you an email containing a link to
            <span class="zoho-highlight">Zoho Sign</span>.
          </p>
          <p class="zoho-text-line">
            Please open the link, review the consent form for account creation
            and data processing authorization, and sign it to activate your
            Taxmind account.
          </p>
          <p class="zoho-text-line zoho-spacing">&nbsp;</p>
          <p class="zoho-text-line">
            Please complete the signing process to activate and access
          </p>
          <p class="zoho-text-line">your account.</p>
        </div>

        <div class="zoho-actions">
          <span class="zoho-already-text">Already Signed ?</span>
          <button class="zoho-login-btn" @click="onLogin">Login</button>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: "ZohoSignPopup",
  props: {
    value: { type: Boolean, default: false },
  },
  data() {
    return {
      visible: this.value,
      // use the icon from the icons folder as requested
      iconSrc: require("@/assets/icons/zohoConf.svg"),
    };
  },
  watch: {
    value(v) {
      this.visible = v;
    },
    visible(v) {
      this.$emit("input", v);
    },
  },
  methods: {
    onLogin() {
      this.$emit("login");
    },
  },
};
</script>

<style scoped>
.zoho-card {
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  padding: 40px 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 580px;
}

.zoho-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 24px;
}

.zoho-icon {
  width: 60px;
  height: 60px;
  flex-shrink: 0;
}

.zoho-title {
  margin: 0;
  font-family: "DM Sans", sans-serif;
  font-weight: 600;
  font-size: 18px;
  line-height: 24px;
  color: black;
  flex-shrink: 0;
  white-space: nowrap;
}

.zoho-description {
  font-family: "DM Sans", sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 24px;
  color: #5f5f5f;
  text-align: center;
  width: 100%;
  max-width: 491px;
  flex-shrink: 0;
}

.zoho-text-line {
  margin: 0;
  margin-bottom: 0;
}

.zoho-spacing {
  margin-bottom: 0;
}

.zoho-highlight {
  color: #1a73e9;
}

.zoho-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.zoho-already-text {
  font-family: "DM Sans", sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 24px;
  color: #5f5f5f;
  text-align: center;
  white-space: nowrap;
}

.zoho-login-btn {
  background: rgba(26, 115, 233, 0.05);
  color: #1a73e9;
  border: none;
  padding: 10px 16px;
  border-radius: 5px;
  font-family: "DM Sans", sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  white-space: nowrap;
  flex-shrink: 0;
}

.zoho-login-btn:hover {
  background: rgba(26, 115, 233, 0.08);
}

.zoho-login-btn:active {
  background: rgba(26, 115, 233, 0.12);
}

@media (max-width: 600px) {
  .zoho-card {
    padding: 32px 20px;
    max-width: 90vw;
  }

  .zoho-description {
    max-width: 100%;
    font-size: 15px;
  }

  .zoho-actions {
    flex-direction: column;
    gap: 12px;
  }

  .zoho-already-text {
    font-size: 15px;
  }

  .zoho-login-btn {
    font-size: 15px;
  }
}
</style>
