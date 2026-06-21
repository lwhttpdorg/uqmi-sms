# See /LICENSE for more information.
# This is free software, licensed under the GNU General Public License v2.

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-uqmi-sms
PKG_VERSION:=0.2.0
PKG_RELEASE:=1

PKG_MAINTAINER:=lwhttpdorg
PKG_LICENSE:=GPL-3.0-or-later
PKG_LICENSE_FILES:=LICENSE

LUCI_TITLE:=LuCI support for uQMI SMS
LUCI_DEPENDS:=+uqmi-sms +luci-base
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
