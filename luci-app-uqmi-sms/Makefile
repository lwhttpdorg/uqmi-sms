# See /LICENSE for more information.
# This is free software, licensed under the GNU General Public License v2.

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-uqmi-sms
PKG_VERSION:=0.1.0
PKG_RELEASE:=1

PKG_MAINTAINER:=lwhttpdorg
PKG_LICENSE:=GPL-3.0-or-later
PKG_LICENSE_FILES:=LICENSE

LUCI_TITLE:=LuCI support for uQMI SMS
LUCI_DEPENDS:=+uqmi-sms +luci-base +rpcd-mod-ucode
LUCI_PKGARCH:=all

define Package/luci-app-uqmi-sms/postinst
[ -n "$${IPKG_INSTROOT}" ] || { \
	[ ! -x /etc/uci-defaults/80_uqmi_sms ] || { \
		/etc/uci-defaults/80_uqmi_sms; \
		rm -f /etc/uci-defaults/80_uqmi_sms; \
	}; \
	rm -f /tmp/luci-indexcache /tmp/luci-indexcache.*; \
	rm -rf /tmp/luci-modulecache/; \
	exit 0; \
}
endef

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
