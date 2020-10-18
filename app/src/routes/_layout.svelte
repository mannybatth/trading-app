<style>
  main {
    position: relative;
    max-width: 56em;
    padding: 2em;
    margin: 0 auto;
    box-sizing: border-box;
  }
</style>

<FirebaseApp firebase="{firebase}">
  <Nav segment="{segment}" />

  <main>
    <slot />
  </main>
</FirebaseApp>

<script>
  import firebase from "firebase/app";
  import "firebase/firestore";
  import { FirebaseApp } from "sveltefire";
  import Nav from "../components/Nav.svelte";
  import { firebaseConfig } from "../firebase-config";
  import "./_app.scss";

  export let segment;

  if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
  }
</script>
