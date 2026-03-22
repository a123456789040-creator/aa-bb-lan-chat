# Publish and Apply in 5 Minutes

Use this checklist after you are ready to make the repository public.

## 1. Create the GitHub repository

In GitHub, click `New repository` and use:

- Repository name: `aa-bb-lan-chat`
- Description: `Lightweight three-role LAN chat demo built with Express and Socket.IO.`
- Visibility: `Public`
- Initialize with README: `No`
- Add .gitignore: `No`
- Choose a license: `No`

Reason:
This local repository already contains the README, license, and other project files.

## 2. Add repository topics

After the repository is created, add these topics:

- `socket-io`
- `express`
- `nodejs`
- `lan`
- `chat`
- `demo`
- `realtime`

## 3. Push this local repository to GitHub

Run these commands in this folder:

```bash
git remote add origin https://github.com/<your-github-user>/aa-bb-lan-chat.git
git push -u origin main
```

Replace `<your-github-user>` with your actual GitHub username.

## 4. Optional but recommended GitHub page edits

Open the repository page and check:

- About description: `Lightweight three-role LAN chat demo built with Express and Socket.IO.`
- Website: leave blank unless you deploy a live demo
- README visible on the home page: yes
- Issues: enabled
- Discussions: optional

## 5. Optional but recommended polish before applying

If you want the application to read a little stronger, do these first:

1. Add 1 screenshot to the README
2. Make 1 small follow-up commit after publishing
3. Add 1 GitHub release such as `v1.0.0`

These are not required, but they help the project look more like an actively maintained public repo.

## 6. Open the OpenAI application

Use:

- Application page: [Codex for Open Source](https://openai.com/form/codex-for-oss/)

## 7. Paste these answers

### Which open source project are you representing?

```text
AA BB LAN Chat
```

### Brief description of the project

```text
AA BB LAN Chat is a lightweight open-source LAN chat application built with Node.js, Express, and Socket.IO. It provides a simple real-time coordination space for three fixed participants, AA, BB, and CC, on the same trusted local network.

The project is intentionally small, easy to inspect, and easy to run. It is designed as both a practical local collaboration tool and a reference implementation for developers who want to study or extend a minimal realtime app with role claiming, presence updates, typing indicators, LAN address discovery, and lightweight helper scripts for testing and scripted messaging.

Because the codebase is compact and understandable, it is also a good candidate for experimenting with maintainer workflows such as issue triage, documentation improvements, code review assistance, and safe incremental feature development.
```

### GitHub repository

```text
https://github.com/<your-github-user>/aa-bb-lan-chat
```

### If there are other people working with you on this project, please list their names here, and what role they will play in the project

```text
The project is currently maintained by a single primary maintainer. Future contributors may help with documentation, UI polish, testing, and incremental feature improvements.
```

### How would you use API credits for your project?

```text
I would use API credits to improve the maintainership workflow around this project in a few focused ways:

1. Issue triage and bug reproduction support for incoming reports
2. Documentation drafting and update suggestions when behavior changes
3. Code review assistance for small patches and regression checks
4. Contributor onboarding support, especially around the LAN workflow and helper scripts
5. Exploration of safe feature additions such as persistent chat history, configurable room behavior, and lightweight access controls for trusted local deployments

I am specifically interested in evaluating whether Codex can help keep a small realtime project easy to maintain without adding unnecessary complexity, while also improving turnaround time for fixes and documentation.
```

### Is there anything else you'd like us to know?

```text
This repository is intentionally scoped as a small, understandable realtime reference project rather than a large framework. My goal is to maintain it as a practical open-source example that other developers can run locally, inspect quickly, and build on safely.

I am also interested in using the project as a test case for lightweight OSS maintainer workflows with Codex, especially around review quality, contributor guidance, and reducing the overhead of maintaining a realtime application.
```

## 8. Best-effort honesty note

This project is still new. If the form or reviewer context makes that relevant, it is better to be honest and let the strength come from clarity and maintainability rather than overstating ecosystem importance.

## 9. Suggested first GitHub release

Tag:

```text
v1.0.0
```

Release title:

```text
AA BB LAN Chat v1.0.0
```

Release notes:

```text
AA BB LAN Chat is a minimal local-network chat app for three fixed participants. It includes a browser UI, role claiming, live presence, typing indicators, LAN URL discovery, and helper scripts for smoke tests and scripted messaging.
```
