<template>
  <div style="height: 100vh">
    <v-layout wrap justify-center pa-6 style="background-color: #f1f7ff" class="fill-height">
      <v-flex xs3 mr-6 class="white">
        <v-layout wrap justify-start pa-4>
          <v-flex xs1 align-self-center>
            <v-btn icon @click="$router.push('/application-list')">
              <v-icon>mdi-chevron-left</v-icon>
            </v-btn>
          </v-flex>
          <v-flex xs8 align-self-center>
            <span class="Head1">{{ LABELS.COMMENTS_HEADER }}</span>
          </v-flex>
        </v-layout>
        <v-divider></v-divider>
        <v-layout wrap justify-start>
          <v-flex xs12 pa-4>
            <v-text-field
              v-model="keyword"
              ref="searchField"
              dense
              :placeholder="LABELS.SEARCH_PLACEHOLDER"
              solo
              flat
              outlined
              hide-details="auto"
              append-icon="mdi-magnify"
              clearable
             :style="{ borderColor: $vuetify.theme.themes.light.inputBorder }"
            />
          </v-flex>
          <!-- User List -->
          <v-flex xs12 v-for="item in items" :key="item.id">
            <v-card
              elevation="0"
              class="pa-2"
              :color="selectedItem && selectedItem.id === item.id ? 'backgroundOne' : ''"
              @click="selectItem(item)"
            >
              <v-layout wrap>
                <v-flex xs1 mr-3 align-self-center>
                  <v-img :src="item.image || defaultImage"></v-img>
                </v-flex>
                <v-flex xs10 class="d-flex flex-column" align-self-center>
                  <span class="subHead1">{{ item.id }}</span>
                  <span class="text1">{{ item.subtitle }}</span>
                </v-flex>
              </v-layout>
            </v-card>
          </v-flex>
        </v-layout>
      </v-flex>

      <v-flex xs7>
        <div class="white">
          <v-layout wrap pa-4 justify-space-between>
            <v-flex xs4 class="d-flex flex-column">
              <span class="subHead1" v-if="selectedItem">{{ selectedItem.id }}</span>
              <span class="text1" v-if="selectedItem">{{ selectedItem.subtitle }}</span>
            </v-flex>
            <v-flex shrink text-right>
              <base-button :label="LABELS.VIEW_APPLICATION" @click="goNext" />
            </v-flex>
          </v-layout>

          <v-divider></v-divider>

          <!-- Messages -->
          <v-layout wrap pa-4 style="height:80vh;width:auto; overflow-y: auto" class="messages-container">
            <v-flex xs12>
              <v-card
                elevation="0"
                class="pa-4"
                v-for="(item, index) in messages"
                :key="item.id"
                :class="{ 'mb-4': index !== messages.length - 1 }"
                style="border-radius: 10px"
                :outlined="index % 2 !== 0"
                :color="index % 2 === 0 ? 'backgroundOne' : undefined"
              >
                <v-layout wrap justify-start>
                  <v-flex shrink mr-3 align-self-center>
                    <v-img
                      :src="item.img || defaultImage2"
                      max-width="30"
                      max-height="30"
                      contain
                    />
                  </v-flex>
                  <v-flex xs5 class="d-flex flex-column" align-self-center>
                    <span class="subHead1">{{ item.name }}</span>
                    <span class="text1">{{ item.date }}</span>
                  </v-flex>
                  <v-flex xs12>
                    <span class="buttonText">{{ item.note }}</span>
                  </v-flex>
                </v-layout>
              </v-card>
            </v-flex>
          </v-layout>
        </div>

        <!-- Comment Box -->
        <v-layout wrap pt-4>
          <v-flex xs12>
            <v-text-field
              v-model="keyword"
              :placeholder="LABELS.WRITE_COMMENT"
              solo
              flat
              hide-details
              background-color="white"
              elevation="0"
            />
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
  </div>
</template>

<script>
import LABELS from "@/constants/labels";
import BaseButton from "../../utilities/BaseButton.vue";
export default {
  components: { BaseButton },
  data() {
    return {
      LABELS,
      defaultImage: require("@/assets/iconsets/user_blue.svg"),
      defaultImage2: require("@/assets/iconsets/user_white.svg"),
      keyword: "",
      selectedItem: null,
      items: [
        {
          id: "TXM00127",
          subtitle: "Manu Sunny",
          date: "2025-08-18",
          note: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.",
          image: "",
        },
        {
          id: "TXM00128",
          subtitle: "Sreejith",
          date: "2025-08-17",
          note: "InLorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.",
          image: "",
          //   image: "@/assets/iconsets/jane.svg",
        },
        {
          id: "TXM00129",
          subtitle: "Manu Sunny",
          date: "2025-08-18",
          note: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.",
          image: "",
        },
        {
          id: "TXM00130",
          subtitle: "Manu Sunny",
          date: "2025-08-18",
          note: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.",
          image: "",
        },
        {
          id: "TXM00131",
          subtitle: "Manu Sunny",
          date: "2025-08-18",
          note: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.",
          image: "",
        },
      ],
      messages: [
        {
          name: "Manu Sunny",
          img: "", // fallback will use defaultImage
          date: "2025-08-18",
          note: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
        },
        {
          name: "Sreejith",
          img: "",
          date: "2025-08-17",
          note: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.",
        },
        {
          name: "John Doe",
          img: "", // custom image
          date: "2025-08-16",
          note: "Another note for John Doe.",
        },
        {
          name: "Jane Smith",
          img: "",
          date: "2025-08-15",
          note: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.",
        },
          {
          name: "Manu Sunny",
          img: "", // fallback will use defaultImage
          date: "2025-08-18",
          note: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
        },
        {
          name: "Sreejith",
          img: "",
          date: "2025-08-17",
          note: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.",
        },
        {
          name: "John Doe",
          img: "", // custom image
          date: "2025-08-16",
          note: "Another note for John Doe.",
        },
        {
          name: "Jane Smith",
          img: "",
          date: "2025-08-15",
          note: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.",
        },
      ],
    };
  },
  mounted() {
    if (this.items.length > 0) {
      this.selectedItem = this.items[0];
    }
  },
  methods: {
    selectItem(item) {
      this.selectedItem = item;
    },
    goNext() {
      console.log("Selected item:", this.selectedItem);
    },
  },
};
</script>
<style scoped>
.messages-container {
  height: 80vh;
  overflow-y: auto;
  scrollbar-width: none; /* Firefox */
}

.messages-container::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Edge */
}

</style>