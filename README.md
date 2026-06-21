# UQMI SMS

This repository contains two OpenWrt packages:

- `uqmi-sms` — Go command line tool, ucode RPC backend and default UCI config.
- `luci-app-uqmi-sms` — LuCI web interface.

## Build with OpenWrt source tree

### Method 1: Add as a feed

Insert into `feeds.conf.default` (before running `./scripts/feeds update -a`):

```text
src-git uqmi_sms https://github.com/lwhttpdorg/uqmi-sms.git;main
```

Then update and install feeds:

```sh
./scripts/feeds update -a
./scripts/feeds install -a
```

### Method 2: Clone into `package/`

After `./scripts/feeds install -a`, run:

```sh
git clone https://github.com/lwhttpdorg/uqmi-sms.git package/uqmi-sms
```

OpenWrt scans `package/` recursively, so both `uqmi-sms` and `luci-app-uqmi-sms` will appear in `make menuconfig` without editing `feeds.conf`.

## License

GPL-3.0-or-later.
