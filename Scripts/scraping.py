import requests
from bs4 import BeautifulSoup
import sys

DOFUS_PORTAL_URL = "https://dofus-portals.fr/portails/2"


def main():
    result = requests.get(DOFUS_PORTAL_URL)
    # print("Sending request to", DOFUS_PORTAL_URL)

    # print("Status code:", result.status_code)

    src = result.content


    soup = BeautifulSoup(src, "lxml")

    posArr = []
    dimensionNameArr = []
    usesLeftArr = []

    portals = soup.find_all("div", {"class": "portal"})

    for portal in portals:
        pos = portal.find('b')
        if pos is not None:
            posArr.append(pos.text)
        else:
            posArr.append("")
        dimensionName = portal.find('h2')
        dimensionNameArr.append(dimensionName.text)
        usesLeft = portal.find('font')
        usesLeftArr.append(usesLeft.text)


    r = []
    nodeJsRes = ""
    for i in range(len(dimensionNameArr)):
        r.append("{}: {} ({} uses left)".format(dimensionNameArr[i], posArr[i], usesLeftArr[i]))
        nodeJsRes += "{}|{}|{}&".format(dimensionNameArr[i], posArr[i], usesLeftArr[i])
    print(nodeJsRes)
    sys.stdout.flush()
    return r

if __name__ == '__main__':
    main()
# return result
