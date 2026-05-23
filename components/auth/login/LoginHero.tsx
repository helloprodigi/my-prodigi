import Image from "next/image";
import styles from "./LoginHero.module.css";

export default function LoginHero() {
  return (
    <div className={styles.root}>
      <Image src="/assets/login/hero.svg" alt="Login hero" width={600} height={400} />
      <p className={styles.caption}>Welcome back — sign in to continue.</p>
    </div>
  );
}
