import Image from "next/image";
import styles from "./RegisterHero.module.css";

export default function RegisterHero() {
  return (
    <div className={styles.root}>
      <Image src="/assets/register/hero.svg" alt="Register hero" width={600} height={400} />
      <p className={styles.caption}>Create your account to get started.</p>
    </div>
  );
}
