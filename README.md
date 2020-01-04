URL: https://mizogaki-portfolio.com

### はじめに
これまではGitHub Pagesで独自ドメインをHTTPS化するにはCloudFlareを仲介させるなどの対応が必要でしたが、この間公式にHTTPS対応がアナウンスされていたので、私のサイトも早速行ってみました。結構簡単にできたので手順を軽くまとめておきます。(HTTP -> HTTPS リダイレクトも行ってくれます)
https://twitter.com/github/status/991366832421523456

**公式ドキュメントはこちら**
https://help.github.com/articles/setting-up-an-apex-domain/

### 前提
すでにGitHub Pagesで独自ドメインによりサーブしているコンテンツ(HTTP通信)がある状態とし、そのサイトをHTTPS化するものとします。

### Step1:　ドメインのDNSレコード設定を変更する
対象ドメインのDNSレコード設定に以下4つのAレコードを追加します。

- 185.199.108.153
- 185.199.109.153
- 185.199.110.153
- 185.199.111.153

お名前.comの設定画面だと、ちょうど以下のようになります。

![sam.jpg](https://qiita-image-store.s3.amazonaws.com/0/73643/da26a80d-2aab-7239-00b9-5123d920b973.jpeg)

### Step2: ドメインを再設定
GithubのSetting画面にいき、ドメインを再設定します。
GitHub Pages > custom domainで、設定済みのドメインを一度クリアしてSave。
その後対象独自ドメインを再入力してSaveします。

<img width="742" alt="スクリーンショット 2018-05-08 0.22.41.png" src="https://qiita-image-store.s3.amazonaws.com/0/73643/30aa2b49-5faf-0dec-93cc-3cae87cdda6c.png">

### Step3: Enforce HTTPSにチェック
Step2を終えると、`Enforce HTTPS`の項目に「Not yet available for your site because the certificate has not finished being issued」と表示されるようになります。

この状態でDNS設定が反映されるまで少し時間がかかるのでしばし待ちます。
(私の環境では15分程度でした)

設定が反映されると、以下のように`Enforce HTTPS`にチェックを入れられるようになるので、ここにチェックをいれることでHTTPS対応は完了となります。

<img width="738" alt="スクリーンショット 2018-05-08 0.28.55.png" src="https://qiita-image-store.s3.amazonaws.com/0/73643/ec5c293b-92c8-60a4-dc73-bf170663dc10.png">

### ちょっとハマった
`Enforce HTTPS`にチェック後、以下のような警告文が表示され続けました。
CNAMEの設定やAレコードの設定などを見直しましたが、解消されず・・
しかし1時間後、警告文は消え、何事もなかったかのようにhttpsでアクセスできるようになってました。なんだったんでしょう、、まあ気にしない。

<img width="763" alt="スクリーンショット 2018-05-07 23.10.38.png" src="https://qiita-image-store.s3.amazonaws.com/0/73643/f0b2c38b-2e31-a9de-dd20-cb0be7f2d20e.png">
